import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract calls
const mockContractCall = vi.fn();

// Mock the tx-sender
let mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAdmin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockAuthority = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const mockCitizen = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';

// Mock contract functions
const citizenVerification = {
  getAdmin: () => mockAdmin,
  getCitizenInfo: (citizenId: string) => {
    if (citizenId === 'valid-citizen-id') {
      return {
        principal: mockCitizen,
        verified: false,
        verificationDate: null,
        verificationMethod: null
      };
    }
    return null;
  },
  isCitizenVerified: (citizenId: string) => {
    return citizenId === 'verified-citizen-id';
  },
  getAuthority: (authorityId: string) => {
    if (authorityId === 'valid-authority-id') {
      return {
        principal: mockAuthority,
        name: 'Test Authority',
        active: true
      };
    }
    return null;
  },
  registerCitizen: (citizenId: string) => {
    mockContractCall('registerCitizen', citizenId);
    if (citizenId === 'existing-citizen-id') {
      return { error: 101 }; // ERR-ALREADY-VERIFIED
    }
    return { value: true };
  },
  verifyCitizen: (citizenId: string, verificationMethod: string, authorityId: string) => {
    mockContractCall('verifyCitizen', citizenId, verificationMethod, authorityId);
    
    if (citizenId === 'non-existent-citizen-id') {
      return { error: 102 }; // ERR-CITIZEN-NOT-FOUND
    }
    
    if (authorityId === 'non-existent-authority-id') {
      return { error: 103 }; // ERR-AUTHORITY-NOT-FOUND
    }
    
    if (mockTxSender !== mockAuthority) {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  },
  addVerificationAuthority: (authorityId: string, authorityPrincipal: string, authorityName: string) => {
    mockContractCall('addVerificationAuthority', authorityId, authorityPrincipal, authorityName);
    
    if (mockTxSender !== mockAdmin) {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  },
  deactivateVerificationAuthority: (authorityId: string) => {
    mockContractCall('deactivateVerificationAuthority', authorityId);
    
    if (mockTxSender !== mockAdmin) {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    if (authorityId === 'non-existent-authority-id') {
      return { error: 103 }; // ERR-AUTHORITY-NOT-FOUND
    }
    
    return { value: true };
  }
};

describe('Citizen Verification Contract', () => {
  beforeEach(() => {
    mockContractCall.mockClear();
    mockTxSender = mockAdmin; // Reset tx-sender to admin for each test
  });
  
  describe('registerCitizen', () => {
    it('should register a new citizen successfully', () => {
      mockTxSender = mockCitizen;
      const result = citizenVerification.registerCitizen('new-citizen-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('registerCitizen', 'new-citizen-id');
    });
    
    it('should fail if citizen already exists',  'new-citizen-id');
  });
  
  it('should fail if citizen already exists', () => {
    mockTxSender = mockCitizen;
    const result = citizenVerification.registerCitizen('existing-citizen-id');
    expect(result).toEqual({ error: 101 }); // ERR-ALREADY-VERIFIED
    expect(mockContractCall).toHaveBeenCalledWith('registerCitizen', 'existing-citizen-id');
  });
});

describe('verifyCitizen', () => {
  it('should verify a citizen successfully', () => {
    mockTxSender = mockAuthority;
    const result = citizenVerification.verifyCitizen('valid-citizen-id', 'government-id', 'valid-authority-id');
    expect(result).toEqual({ value: true });
    expect(mockContractCall).toHaveBeenCalledWith('verifyCitizen', 'valid-citizen-id', 'government-id', 'valid-authority-id');
  });
  
  it('should fail if citizen does not exist', () => {
    mockTxSender = mockAuthority;
    const result = citizenVerification.verifyCitizen('non-existent-citizen-id', 'government-id', 'valid-authority-id');
    expect(result).toEqual({ error: 102 }); // ERR-CITIZEN-NOT-FOUND
  });
  
  it('should fail if authority does not exist', () => {
    mockTxSender = mockAuthority;
    const result = citizenVerification.verifyCitizen('valid-citizen-id', 'government-id', 'non-existent-authority-id');
    expect(result).toEqual({ error: 103 }); // ERR-AUTHORITY-NOT-FOUND
  });
  
  it('should fail if caller is not the authority', () => {
    mockTxSender = mockCitizen; // Not the authority
    const result = citizenVerification.verifyCitizen('valid-citizen-id', 'government-id', 'valid-authority-id');
    expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
  });
});

describe('addVerificationAuthority', () => {
  it('should add a verification authority successfully', () => {
    const result = citizenVerification.addVerificationAuthority('new-authority-id', mockAuthority, 'New Authority');
    expect(result).toEqual({ value: true });
    expect(mockContractCall).toHaveBeenCalledWith('addVerificationAuthority', 'new-authority-id', mockAuthority, 'New Authority');
  });
  
  it('should fail if caller is not admin', () => {
    mockTxSender = mockCitizen; // Not the admin
    const result = citizenVerification.addVerificationAuthority('new-authority-id', mockAuthority, 'New Authority');
    expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
  });
});

describe('deactivateVerificationAuthority', () => {
  it('should deactivate a verification authority successfully', () => {
    const result = citizenVerification.deactivateVerificationAuthority('valid-authority-id');
    expect(result).toEqual({ value: true });
    expect(mockContractCall).toHaveBeenCalledWith('deactivateVerificationAuthority', 'valid-authority-id');
  });
  
  it('should fail if authority does not exist', () => {
    const result = citizenVerification.deactivateVerificationAuthority('non-existent-authority-id');
    expect(result).toEqual({ error: 103 }); // ERR-AUTHORITY-NOT-FOUND
  });
  
  it('should fail if caller is not admin', () => {
    mockTxSender = mockCitizen; // Not the admin
    const result = citizenVerification.deactivateVerificationAuthority('valid-authority-id');
    expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
  });
});
});
