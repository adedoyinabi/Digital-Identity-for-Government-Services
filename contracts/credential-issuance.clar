;; Credential Issuance Contract - Simplified
;; This contract issues verifiable government attestations

;; Define data variables
(define-data-var admin principal tx-sender)

;; Simple map for credentials
(define-map credentials
  { id: (string-utf8 36) }
  {
    citizen-id: (string-utf8 36),
    type: (string-utf8 36),
    valid: bool
  }
)

;; Simple map for credential types
(define-map credential-types
  { id: (string-utf8 36) }
  { active: bool }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-ALREADY-EXISTS (err u201))
(define-constant ERR-NOT-FOUND (err u202))

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (is-valid-credential (id (string-utf8 36)))
  (default-to false (get valid (map-get? credentials { id: id })))
)

(define-read-only (is-active-type (id (string-utf8 36)))
  (default-to false (get active (map-get? credential-types { id: id })))
)

;; Public functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))
  )
)

(define-public (register-credential-type (id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set credential-types { id: id } { active: true }))
  )
)

(define-public (issue-credential (id (string-utf8 36)) (citizen-id (string-utf8 36)) (type (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-active-type type) ERR-NOT-FOUND)
    (asserts! (is-none (map-get? credentials { id: id })) ERR-ALREADY-EXISTS)
    (ok (map-set credentials
      { id: id }
      {
        citizen-id: citizen-id,
        type: type,
        valid: true
      }
    ))
  )
)

(define-public (revoke-credential (id (string-utf8 36)))
  (let ((credential (map-get? credentials { id: id })))
    (asserts! (is-some credential) ERR-NOT-FOUND)
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set credentials
      { id: id }
      {
        citizen-id: (get citizen-id (unwrap-panic credential)),
        type: (get type (unwrap-panic credential)),
        valid: false
      }
    ))
  )
)

