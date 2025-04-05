import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract calls
const mockContractCall = vi.fn();

// Mock the tx-sender
let mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAdmin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockIssuer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const mockCitizen = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';

// Mock current block time
const mockCurrentTime = 1617235200; // Example timestamp

// Mock credential types
const mockCredentialTypes = {
  'driver-license': {
    name: 'Driver License',
    active: true,
    authorizedIssuers: [mockIssuer]
  },
  'passport': {
    name: 'Passport',
    active: true,
    authorizedIssuers: [mockIssuer]
  },
  'inactive-type': {
    name: 'Inactive Credential',
    active: false,
    authorizedIssuers: [mockIssuer]
  }
};

// Mock credentials
const mockCredentials = {
  'valid-credential-id': {
    citizenId: 'valid-citizen-id',
    credentialType: 'driver-license',
    issuer: mockIssuer,
    issueDate: mockCurrentTime - 10000,
    expiryDate: mockCurrentTime + 10000,
    revoked: false,
    metadata: 'Valid credential'
  },
  'revoked-credential-id': {
    citizenId: 'valid-citizen-id',
    credentialType: 'driver-license',
    issuer: mockIssuer,
    issueDate: mockCurrentTime - 10000,
    expiryDate: mockCurrentTime + 10000,
    revoked: true,
    metadata: 'Revoked credential'
  },
  'expired-credential-id': {
    citizenId: 'valid-citizen-id',
    credentialType: 'driver-license',
    issuer: mockIssuer,
    issueDate: mockCurrentTime - 20000,
    expiryDate: mockCurrentTime - 10000,
    revoked: false,
    metadata: 'Expired credential'
  }
};

// Mock contract functions
const credentialIssuance = {
  getAdmin: () => mockAdmin,
  getCredential: (credentialId: string) => {
    return mockCredentials[credentialId] || null;
  },
  getCredentialType: (typeId: string) => {
    return mockCredentialTypes[typeId] || null;
  },
  getCitizenCredentials: (citizenId: string) => {
    if (citizenId === 'valid-citizen-id') {
      return {
        credentialIds: ['valid-credential-id', 'revoked-credential-id', 'expired-credential-id']
      };
    }
    return { credentialIds: [] };
  },
  isCredentialValid: (credentialId: string) => {
    const credential = mockCredentials[credentialId];
    if (!credential) return false;
    if (credential.revoked) return false;
    if (credential.expiryDate && credential.expiryDate < mockCurrentTime) return false;
    return true;
  },
  registerCredentialType: (typeId: string, name: string, authorizedIssuers: string[]) => {
    mockContractCall('registerCredentialType', typeId, name, authorizedIssuers);
    
    if (mockTxSender !== mockAdmin) {
      return { error: 200 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  },
  issueCredential: (credentialId: string, citizenId: string, credentialType: string, expiryDate: number | null, metadata: string) => {
    mockContractCall('issueCredential', credentialId, citizenId, credentialType, expiryDate, metadata);
    
    if (credentialId === 'existing-credential-id') {
      return { error: 201 }; // ERR-CREDENTIAL-EXISTS
    }
    
    if (!mockCredentialTypes[credentialType]) {
      return { error: 203 }; // ERR-TYPE-NOT-FOUND
    }
    
    const type = mockCredentialTypes[credentialType];
    if (!type.authorizedIssuers.includes(mockTxSender)) {
      return { error: 207 }; // ERR-NOT-AUTHORIZED-ISSUER
    }
    
    return { value: true };
  },
  revokeCredential: (credentialId: string) => {
    mockContractCall('revokeCredential', credentialId);
    
    if (!mockCredentials[credentialId]) {
      return { error: 202 }; // ERR-CREDENTIAL-NOT-FOUND
    }
    
    const credential = mockCredentials[credentialId];
    if (mockTxSender !== mockAdmin && mockTxSender !== credential.issuer) {
      return { error: 200 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  }
};

describe('Credential Issuance Contract', () => {
  beforeEach(() => {
    mockContractCall.mockClear();
    mockTxSender = mockAdmin; // Reset tx-sender to admin for each test
  });
  
  describe('registerCredentialType', () => {
    it('should register a new credential type successfully', () => {
      const result = credentialIssuance.registerCredentialType('new-type', 'New Type', [mockIssuer]);
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('registerCredentialType', 'new-type', 'New Type', [mockIssuer]);
    });
    
    it('should fail if caller is not admin', () => {
      mockTxSender = mockIssuer; // Not the admin
      const result = credentialIssuance.registerCredentialType('new-type', 'New Type', [mockIssuer]);
      expect(result).toEqual({ error: 200 }); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe('issueCredential', () => {
    it('should issue a credential successfully', () => {
      mockTxSender = mockIssuer;
      const result = credentialIssuance.issueCredential(
          'new-credential-id',
          'valid-citizen-id',
          'driver-license',
          mockCurrentTime + 10000,
          'New credential'
      );
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith(
          'issueCredential',
          'new-credential-id',
          'valid-citizen-id',
          'driver-license',
          mockCurrentTime + 10000,
          'New credential'
      );
    });
    
    it('should fail if credential already exists', () => {
      mockTxSender = mockIssuer;
      const result = credentialIssuance.issueCredential(
          'existing-credential-id',
          'valid-citizen-id',
          'driver-license',
          mockCurrentTime + 10000,
          'New credential'
      );
      expect(result).toEqual({ error: 201 }); // ERR-CREDENTIAL-EXISTS
    });
    
    it('should fail if credential type does not exist', () => {
      mockTxSender = mockIssuer;
      const result = credentialIssuance.issueCredential(
          'new-credential-id',
          'valid-citizen-id',
          'non-existent-type',
          mockCurrentTime + 10000,
          'New credential'
      );
      expect(result).toEqual({ error: 203 }); // ERR-TYPE-NOT-FOUND
    });
    
    it('should fail if caller is not an authorized issuer', () => {
      mockTxSender = mockCitizen; // Not an authorized issuer
      const result = credentialIssuance.issueCredential(
          'new-credential-id',
          'valid-citizen-id',
          'driver-license',
          mockCurrentTime + 10000,
          'New credential'
      );
      expect(result).toEqual({ error: 207 }); // ERR-NOT-AUTHORIZED-ISSUER
    });
  });
  
  describe('revokeCredential', () => {
    it('should revoke a credential successfully as admin', () => {
      const result = credentialIssuance.revokeCredential('valid-credential-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('revokeCredential', 'valid-credential-id');
    });
    
    it('should revoke a credential successfully as issuer', () => {
      mockTxSender = mockIssuer;
      const result = credentialIssuance.revokeCredential('valid-credential-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('revokeCredential', 'valid-credential-id');
    });
    
    it('should fail if credential does not exist', () => {
      const result = credentialIssuance.revokeCredential('non-existent-credential-id');
      expect(result).toEqual({ error: 202 }); // ERR-CREDENTIAL-NOT-FOUND
    });
    
    it('should fail if caller is not admin or issuer', () => {
      mockTxSender = mockCitizen; // Not admin or issuer
      const result = credentialIssuance.revokeCredential('valid-credential-id');
      expect(result).toEqual({ error: 200 }); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe('isCredentialValid', () => {
    it('should return true for valid credentials', () => {
      const result = credentialIssuance.isCredentialValid('valid-credential-id');
      expect(result).toBe(true);
    });
    
    it('should return false for revoked credentials', () => {
      const result = credentialIssuance.isCredentialValid('revoked-credential-id');
      expect(result).toBe(false);
    });
    
    it('should return false for expired credentials', () => {
      const result = credentialIssuance.isCredentialValid('expired-credential-id');
      expect(result).toBe(false);
    });
    
    it('should return false for non-existent credentials', () => {
      const result = credentialIssuance.isCredentialValid('non-existent-credential-id');
      expect(result).toBe(false);
    });
  });
});
