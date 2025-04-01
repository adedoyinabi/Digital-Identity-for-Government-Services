;; Service Access Contract - Simplified
;; This contract manages permissions for different government systems

;; Define data variables
(define-data-var admin principal tx-sender)

;; Simple map for services
(define-map services
  { id: (string-utf8 36) }
  { active: bool }
)

;; Simple map for access rights
(define-map access-rights
  { service-id: (string-utf8 36), citizen-id: (string-utf8 36) }
  { has-access: bool }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-NOT-FOUND (err u301))

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (is-service-active (id (string-utf8 36)))
  (default-to false (get active (map-get? services { id: id })))
)

(define-read-only (has-access (service-id (string-utf8 36)) (citizen-id (string-utf8 36)))
  (default-to false (get has-access (map-get? access-rights { service-id: service-id, citizen-id: citizen-id })))
)

;; Public functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))
  )
)

(define-public (register-service (id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set services { id: id } { active: true }))
  )
)

(define-public (update-service-status (id (string-utf8 36)) (active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? services { id: id })) ERR-NOT-FOUND)
    (ok (map-set services { id: id } { active: active }))
  )
)

(define-public (grant-access (service-id (string-utf8 36)) (citizen-id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (is-service-active service-id) ERR-NOT-FOUND)
    (ok (map-set access-rights
      { service-id: service-id, citizen-id: citizen-id }
      { has-access: true }
    ))
  )
)

(define-public (revoke-access (service-id (string-utf8 36)) (citizen-id (string-utf8 36)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set access-rights
      { service-id: service-id, citizen-id: citizen-id }
      { has-access: false }
    ))
  )
)

