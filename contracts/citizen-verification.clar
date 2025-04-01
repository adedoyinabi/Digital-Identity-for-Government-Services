;; Citizen Verification Contract - Simplified
;; This contract validates citizen identity through official channels

;; Define data variables
(define-data-var admin principal tx-sender)

;; Simple map for citizens - just track if they're verified
(define-map verified-citizens
  { id: (string-utf8 36) }
  { verified: bool }
)

;; Simple map for authorities
(define-map authorities
  { id: (string-utf8 36) }
  { active: bool }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-VERIFIED (err u101))
(define-constant ERR-NOT-FOUND (err u102))

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (is-verified (id (string-utf8 36)))
  (default-to false (get verified (map-get? verified-citizens { id: id })))
)

(define-read-only (is-authority (id (string-utf8 36)))
  (default-to false (get active (map-get? authorities { id: id })))
)

;; Public functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))
  )
)

(define-public (register-citizen (id (string-utf8 36)))
  (begin
    (asserts! (is-none (map-get? verified-citizens { id: id })) ERR-ALREADY-VERIFIED)
    (ok (map-set verified-citizens { id: id } { verified: false }))
  )
)

(define-public (verify-citizen (id (string-utf8 36)) (authority-id (string-utf8 36)))
  (begin
    (asserts! (is-authority authority-id) ERR-NOT-AUTHORIZED)
    (ok (map-set verified-citizens { id: id } { verified: true }))
  )
)

(define-public (add-authority (id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set authorities { id: id } { active: true }))
  )
)

(define-public (remove-authority (id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set authorities { id: id } { active: false }))
  )
)

