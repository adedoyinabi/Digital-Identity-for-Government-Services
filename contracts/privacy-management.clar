;; Privacy Management Contract - Simplified
;; This contract controls what information is shared with agencies

;; Define data variables
(define-data-var admin principal tx-sender)

;; Simple map for privacy settings
(define-map privacy-settings
  { citizen-id: (string-utf8 36), data-type: (string-utf8 36) }
  { can-share: bool }
)

;; Simple map for service authorizations
(define-map service-authorizations
  { citizen-id: (string-utf8 36), data-type: (string-utf8 36), service-id: (string-utf8 36) }
  { authorized: bool }
)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u400))

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (can-share-data (citizen-id (string-utf8 36)) (data-type (string-utf8 36)))
  (default-to false (get can-share (map-get? privacy-settings { citizen-id: citizen-id, data-type: data-type })))
)

(define-read-only (is-service-authorized
  (citizen-id (string-utf8 36))
  (data-type (string-utf8 36))
  (service-id (string-utf8 36)))
  (default-to false (get authorized (map-get? service-authorizations
    { citizen-id: citizen-id, data-type: data-type, service-id: service-id }
  )))
)

;; Public functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (var-set admin new-admin))
  )
)

(define-public (update-sharing-settings
  (citizen-id (string-utf8 36))
  (data-type (string-utf8 36))
  (can-share bool))
  (begin
    ;; In a real implementation, we would check if the caller is the citizen or admin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set privacy-settings
      { citizen-id: citizen-id, data-type: data-type }
      { can-share: can-share }
    ))
  )
)

(define-public (authorize-service
  (citizen-id (string-utf8 36))
  (data-type (string-utf8 36))
  (service-id (string-utf8 36))
  (authorized bool))
  (begin
    ;; In a real implementation, we would check if the caller is the citizen or admin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (ok (map-set service-authorizations
      { citizen-id: citizen-id, data-type: data-type, service-id: service-id }
      { authorized: authorized }
    ))
  )
)

(define-public (can-access-data
  (citizen-id (string-utf8 36))
  (data-type (string-utf8 36))
  (service-id (string-utf8 36)))
  (begin
    (ok (and
      (can-share-data citizen-id data-type)
      (is-service-authorized citizen-id data-type service-id)
    ))
  )
)

