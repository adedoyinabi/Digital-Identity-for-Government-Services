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
  isVerified: (id: string) => {
    return id === 'verified-citizen-id';
  },
  isAuthority: (id: string) => {
    return id === 'valid-authority-id';
  },
  registerCitizen: (id: string) => {
    mockContractCall('registerCitizen', id);
    if (id === 'existing-citizen-id') {
      return { error: 101 }; // ERR-ALREADY-VERIFIED
    }
    return { value: true };
  },
  verifyCitizen: (id: string, authorityId: string) => {
    mockContractCall('verifyCitizen', id, authorityId);
    
    if (authorityId !== 'valid-authority-id') {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  },
  addAuthority: (id: string) => {
    mockContractCall('addAuthority', id);
    
    if (mockTxSender !== mockAdmin) {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    return { value: true };
  },
  removeAuthority: (id: string) => {
    mockContractCall('removeAuthority', id);
    
    if (mockTxSender !== mockAdmin) {
      return { error: 100 }; // ERR-NOT-AUTHORIZED
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
    
    it('should fail if citizen already exists', () => {
      mockTxSender = mockCitizen;
      const result = citizenVerification.registerCitizen('existing-citizen-id');
      expect(result).toEqual({ error: 101 }); // ERR-ALREADY-VERIFIED
      expect(mockContractCall).toHaveBeenCalledWith('registerCitizen', 'existing-citizen-id');
    });
  });
  
  describe('verifyCitizen', () => {
    it('should verify a citizen successfully', () => {
      const result = citizenVerification.verifyCitizen('valid-citizen-id', 'valid-authority-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('verifyCitizen', 'valid-citizen-id', 'valid-authority-id');
    });
    
    it('should fail if authority is not valid', () => {
      const result = citizenVerification.verifyCitizen('valid-citizen-id', 'invalid-authority-id');
      expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe('addAuthority', () => {
    it('should add an authority successfully', () => {
      const result = citizenVerification.addAuthority('new-authority-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('addAuthority', 'new-authority-id');
    });
    
    it('should fail if caller is not admin', () => {
      mockTxSender = mockCitizen; // Not the admin
      const result = citizenVerification.addAuthority('new-authority-id');
      expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe('removeAuthority', () => {
    it('should remove an authority successfully', () => {
      const result = citizenVerification.removeAuthority('valid-authority-id');
      expect(result).toEqual({ value: true });
      expect(mockContractCall).toHaveBeenCalledWith('removeAuthority', 'valid-authority-id');
    });
    
    it('should fail if caller is not admin', () => {
      mockTxSender = mockCitizen; // Not the admin
      const result = citizenVerification.removeAuthority('valid-authority-id');
      expect(result).toEqual({ error: 100 }); // ERR-NOT-AUTHORIZED
    });
  });
});
