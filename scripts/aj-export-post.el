;;; aj-export-post.el --- Export org posts to mdsvex markdown with a staleness hash -*- lexical-binding: t; -*-

;;; Commentary:
;;
;; Publishing pipeline for ajensen.org (see docs/content-authoring.md).
;;
;; Writes a sibling .md next to a .org post with mdsvex frontmatter:
;;   title, date, description, tags, org_hash
;;
;; The org_hash is the sha256 of the WHOLE org file, whitespace-normalized —
;; byte-for-byte the same normalization as scripts/check-content.ts
;; (trailing spaces/tabs stripped per line, leading blank lines dropped,
;; trailing whitespace trimmed). The build fails loudly when a .md is absent,
;; orphaned, or stale relative to its .org.
;;
;; Dates come from the #+DATE keyword only — nothing is stamped from the
;; clock, so repeated exports are deterministic.
;;
;; Usage:
;;   M-x aj-export-post          (from a .org file in src/content/posts/)
;;   emacs --batch -l scripts/aj-export-post.el --eval '(aj-export-post "src/content/posts/<slug>.org")'

;;; Code:

(require 'ox)
(require 'ox-md)
(require 'subr-x)

(defun aj--file-bytes (path)
  "Return the raw byte string of PATH (unibyte, no coding conversion)."
  (with-temp-buffer
    (set-buffer-multibyte nil)
    (insert-file-contents-literally path)
    (buffer-string)))

(defun aj--normalize-bytes (bytes)
  "Whitespace-normalize BYTES exactly like scripts/check-content.ts.
UTF-8 multibyte sequences never contain space/tab/newline bytes, so a
byte-level normalization is equivalent to a character-level one."
  (let* ((lines (mapcar
                 (lambda (line) (replace-regexp-in-string "[ \t]+$" "" line))
                 (split-string bytes "\n")))
         (joined (string-join lines "\n")))
    (setq joined (replace-regexp-in-string "\\`\n+" "" joined))
    (replace-regexp-in-string "[ \t\n]+\\'" "" joined)))

(defun aj--org-hash (org-file)
  "Return the sha256 of the normalized contents of ORG-FILE."
  (secure-hash 'sha256 (aj--normalize-bytes (aj--file-bytes org-file))))

(defun aj--org-keyword (keyword)
  "Return the value of the document-level #+KEYWORD in the current buffer, or nil.
Some keywords (e.g. FILETAGS) come back as lists; coerce those to strings."
  (let ((value (cdr (assoc keyword (org-collect-keywords (list keyword))))))
    (cond ((stringp value) value)
          ((consp value) (string-join value " "))
          (t value))))

(defun aj-export-post (org-file)
  "Export the org post ORG-FILE to a sibling .md with mdsvex frontmatter.
Interactively, exports the visited .org file."
  (interactive (list (or (buffer-file-name)
                         (user-error "Visit a .org post file first"))))
  (unless (string-match-p "\\.org\\'" org-file)
    (user-error "Not an .org file: %s" org-file))
  (let* ((org-file (expand-file-name org-file))
         (slug (file-name-base org-file))
         (md-file (concat (file-name-sans-extension org-file) ".md"))
         frontmatter body)
    (with-current-buffer (find-file-noselect org-file)
      (org-mode)
      (let* ((title (or (aj--org-keyword "TITLE") slug))
             (date (or (aj--org-keyword "DATE")
                       (user-error "#+DATE missing in %s (dates come from the keyword, never the clock)" org-file)))
             (description (aj--org-keyword "DESCRIPTION"))
             (filetags (aj--org-keyword "FILETAGS"))
             (tags (when filetags
                     (format "[%s]"
                             (string-join
                              (mapcar (lambda (tag) (format "%S" (downcase tag)))
                                      (split-string filetags ":" t " "))
                              ", "))))
             (org-hash (aj--org-hash org-file)))
        ;; Render the body through ox-md, then strip any leading frontmatter
        ;; collisions by taking the export as-is below the title.
        (setq body
              (string-trim
               (org-export-as 'md nil nil nil '(:with-toc nil :with-title nil))))
        (setq frontmatter
              (concat
               "---\n"
               (format "title: %s\n" title)
               (format "date: %s\n" date)
               (when description (format "description: %s\n" description))
               (when tags (format "tags: %s\n" tags))
               (format "org_hash: %s\n" org-hash)
               "---\n\n"))))
    (with-temp-file md-file
      (set-buffer-multibyte t)
      (insert frontmatter)
      (insert body)
      (insert "\n"))
    (message "aj-export-post: wrote %s (org_hash %s)" md-file (substring (aj--org-hash org-file) 0 12))))

(provide 'aj-export-post)
;;; aj-export-post.el ends here
