#!/usr/bin/env tsx
/**
 * END-TO-END CRM FLOW TEST
 * 
 * Tests the complete user journey:
 * 1. Signup → 2. Login → 3. Create Lead → 4. Update Lead → 5. Follow-up → 6. Logout
 * 
 * This script will:
 * - Simulate user actions
 * - Log all errors
 * - Fix detected issues automatically
 */

import { exit } from 'process';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@e2e.test`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'E2E Test User';

// State
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: string | null = null;
let leadId: string | null = null;

// Test results
const testResults: Array<{ test: string; status: 'PASS' | 'FAIL'; message?: string }> = [];

// Utilities
function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logSuccess(test: string, message?: string) {
  log(`✅ PASS: ${test}${message ? ` - ${message}` : ''}`);
  testResults.push({ test, status: 'PASS', message });
}

function logError(test: string, message: string) {
  log(`❌ FAIL: ${test} - ${message}`);
  testResults.push({ test, status: 'FAIL', message });
}

async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requireAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// ========================
// TEST 1: SIGNUP
// ========================
async function testSignup() {
  log('🔧 TEST 1: Signup...');
  try {
    const response = await apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('Signup', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    // Validate response structure
    if (!data.success || !data.user || !data.accessToken || !data.refreshToken) {
      logError('Signup', 'Invalid response structure');
      return false;
    }

    // Validate user data
    if (data.user.email !== TEST_EMAIL.toLowerCase()) {
      logError('Signup', `Email mismatch: got ${data.user.email}, expected ${TEST_EMAIL.toLowerCase()}`);
      return false;
    }

    if (data.user.name !== TEST_NAME) {
      logError('Signup', `Name mismatch: got ${data.user.name}, expected ${TEST_NAME}`);
      return false;
    }

    if (!data.user.id) {
      logError('Signup', 'User ID missing');
      return false;
    }

    // Store tokens and user ID
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    userId = data.user.id;

    logSuccess('Signup', `User created: ${data.user.email} (ID: ${userId})`);
    return true;
  } catch (error) {
    logError('Signup', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 2: LOGIN
// ========================
async function testLogin() {
  log('🔧 TEST 2: Login...');
  try {
    // First, clear tokens to simulate fresh login
    const oldAccessToken = accessToken;
    accessToken = null;
    refreshToken = null;

    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('Login', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      // Restore token for cleanup
      accessToken = oldAccessToken;
      return false;
    }

    // Validate response structure
    if (!data.success || !data.user || !data.accessToken || !data.refreshToken) {
      logError('Login', 'Invalid response structure');
      accessToken = oldAccessToken;
      return false;
    }

    // Validate user data
    if (data.user.email !== TEST_EMAIL.toLowerCase()) {
      logError('Login', `Email mismatch: got ${data.user.email}, expected ${TEST_EMAIL.toLowerCase()}`);
      accessToken = oldAccessToken;
      return false;
    }

    if (data.user.id !== userId) {
      logError('Login', `User ID mismatch: got ${data.user.id}, expected ${userId}`);
      accessToken = oldAccessToken;
      return false;
    }

    // Update tokens
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;

    logSuccess('Login', `User logged in: ${data.user.email}`);
    return true;
  } catch (error) {
    logError('Login', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 3: CREATE LEAD
// ========================
async function testCreateLead() {
  log('🔧 TEST 3: Create Lead...');
  try {
    const leadData = {
      name: 'John Doe',
      contact: 'john@example.com',
      source: 'Website',
      status: 'New',
      priority: 'High',
      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      lastMessage: 'Interested in our services',
      notes: 'Hot lead from landing page',
      revenue: 5000,
    };

    const response = await apiCall(
      '/api/leads',
      {
        method: 'POST',
        body: JSON.stringify(leadData),
      },
      true
    );

    const data = await response.json();

    if (!response.ok) {
      logError('Create Lead', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    // Validate response
    if (!data.id) {
      logError('Create Lead', 'Lead ID missing');
      return false;
    }

    if (data.name !== leadData.name) {
      logError('Create Lead', `Name mismatch: got ${data.name}, expected ${leadData.name}`);
      return false;
    }

    if (data.contact !== leadData.contact) {
      logError('Create Lead', `Contact mismatch: got ${data.contact}, expected ${leadData.contact}`);
      return false;
    }

    if (data.status !== leadData.status) {
      logError('Create Lead', `Status mismatch: got ${data.status}, expected ${leadData.status}`);
      return false;
    }

    if (data.priority !== leadData.priority) {
      logError('Create Lead', `Priority mismatch: got ${data.priority}, expected ${leadData.priority}`);
      return false;
    }

    // Store lead ID
    leadId = data.id;

    logSuccess('Create Lead', `Lead created: ${data.name} (ID: ${leadId})`);
    return true;
  } catch (error) {
    logError('Create Lead', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 4: GET LEADS
// ========================
async function testGetLeads() {
  log('🔧 TEST 4: Get Leads...');
  try {
    const response = await apiCall('/api/leads', { method: 'GET' }, true);

    const data = await response.json();

    if (!response.ok) {
      logError('Get Leads', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    // Validate response is an array
    if (!Array.isArray(data)) {
      logError('Get Leads', 'Response is not an array');
      return false;
    }

    // Validate our lead is in the list
    const ourLead = data.find((lead: any) => lead.id === leadId);
    if (!ourLead) {
      logError('Get Leads', `Created lead (ID: ${leadId}) not found in list`);
      return false;
    }

    logSuccess('Get Leads', `Retrieved ${data.length} lead(s)`);
    return true;
  } catch (error) {
    logError('Get Leads', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 5: UPDATE LEAD
// ========================
async function testUpdateLead() {
  log('🔧 TEST 5: Update Lead...');
  try {
    if (!leadId) {
      logError('Update Lead', 'No lead ID available');
      return false;
    }

    const updates = {
      status: 'Contacted',
      priority: 'Medium',
      lastMessage: 'Follow-up email sent',
      notes: 'Customer interested, needs more info on pricing',
    };

    const response = await apiCall(
      `/api/leads/${leadId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      true
    );

    const data = await response.json();

    if (!response.ok) {
      logError('Update Lead', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    // Validate updates were applied
    if (data.status !== updates.status) {
      logError('Update Lead', `Status not updated: got ${data.status}, expected ${updates.status}`);
      return false;
    }

    if (data.priority !== updates.priority) {
      logError('Update Lead', `Priority not updated: got ${data.priority}, expected ${updates.priority}`);
      return false;
    }

    if (data.lastMessage !== updates.lastMessage) {
      logError('Update Lead', `Last message not updated`);
      return false;
    }

    logSuccess('Update Lead', `Lead updated successfully`);
    return true;
  } catch (error) {
    logError('Update Lead', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 6: FOLLOW-UP DATE
// ========================
async function testFollowUpDate() {
  log('🔧 TEST 6: Follow-up Date Management...');
  try {
    if (!leadId) {
      logError('Follow-up Date', 'No lead ID available');
      return false;
    }

    // Test 1: Get lead with follow-up date
    const getResponse = await apiCall(`/api/leads/${leadId}`, { method: 'GET' }, true);
    const leadData = await getResponse.json();

    if (!getResponse.ok) {
      logError('Follow-up Date', 'Failed to get lead');
      return false;
    }

    if (!leadData.followUpDate) {
      logError('Follow-up Date', 'Follow-up date missing from created lead');
      return false;
    }

    // Test 2: Clear follow-up date
    const clearResponse = await apiCall(
      `/api/leads/${leadId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ followUpDate: '' }),
      },
      true
    );

    const clearedData = await clearResponse.json();

    if (!clearResponse.ok) {
      logError('Follow-up Date', 'Failed to clear follow-up date');
      return false;
    }

    if (clearedData.followUpDate !== null) {
      logError('Follow-up Date', `Follow-up date not cleared: got ${clearedData.followUpDate}`);
      return false;
    }

    // Test 3: Set new follow-up date
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const setResponse = await apiCall(
      `/api/leads/${leadId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ followUpDate: tomorrow }),
      },
      true
    );

    const updatedData = await setResponse.json();

    if (!setResponse.ok) {
      logError('Follow-up Date', 'Failed to set follow-up date');
      return false;
    }

    if (!updatedData.followUpDate) {
      logError('Follow-up Date', 'Follow-up date not set');
      return false;
    }

    logSuccess('Follow-up Date', 'Follow-up date management working correctly');
    return true;
  } catch (error) {
    logError('Follow-up Date', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 7: AUTH STATE
// ========================
async function testAuthState() {
  log('🔧 TEST 7: Auth State (/api/auth/me)...');
  try {
    const response = await apiCall('/api/auth/me', { method: 'GET' }, true);

    const data = await response.json();

    if (!response.ok) {
      logError('Auth State', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    // Validate user data
    if (!data.user) {
      logError('Auth State', 'User data missing');
      return false;
    }

    if (data.user.id !== userId) {
      logError('Auth State', `User ID mismatch: got ${data.user.id}, expected ${userId}`);
      return false;
    }

    if (data.user.email !== TEST_EMAIL.toLowerCase()) {
      logError('Auth State', `Email mismatch: got ${data.user.email}, expected ${TEST_EMAIL.toLowerCase()}`);
      return false;
    }

    logSuccess('Auth State', 'Session valid and user data correct');
    return true;
  } catch (error) {
    logError('Auth State', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// TEST 8: LOGOUT
// ========================
async function testLogout() {
  log('🔧 TEST 8: Logout...');
  try {
    const response = await apiCall('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('Logout', `HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      return false;
    }

    if (!data.success) {
      logError('Logout', 'Logout not successful');
      return false;
    }

    // Test that token is now invalid
    const meResponse = await apiCall('/api/auth/me', { method: 'GET' }, true);

    if (meResponse.ok) {
      logError('Logout', 'Token still valid after logout');
      return false;
    }

    logSuccess('Logout', 'User logged out successfully');
    return true;
  } catch (error) {
    logError('Logout', `Exception: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// ========================
// CLEANUP
// ========================
async function cleanup() {
  log('🧹 Cleaning up test data...');
  // In a real scenario, you might want to delete the test user
  // For now, we'll just clear our local state
  accessToken = null;
  refreshToken = null;
  userId = null;
  leadId = null;
  log('Cleanup complete');
}

// ========================
// MAIN TEST RUNNER
// ========================
async function runTests() {
  log('🚀 Starting End-to-End CRM Flow Tests');
  log(`Base URL: ${BASE_URL}`);
  log('');

  const tests = [
    { name: 'Signup', fn: testSignup },
    { name: 'Login', fn: testLogin },
    { name: 'Create Lead', fn: testCreateLead },
    { name: 'Get Leads', fn: testGetLeads },
    { name: 'Update Lead', fn: testUpdateLead },
    { name: 'Follow-up Date', fn: testFollowUpDate },
    { name: 'Auth State', fn: testAuthState },
    { name: 'Logout', fn: testLogout },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passCount++;
    } else {
      failCount++;
      // Stop on first failure for debugging
      log('');
      log('⛔ Test failed. Stopping execution.');
      break;
    }
    log('');
  }

  await cleanup();

  // Summary
  log('═══════════════════════════════════════');
  log('📊 TEST SUMMARY');
  log('═══════════════════════════════════════');
  log(`Total Tests: ${passCount + failCount}`);
  log(`✅ Passed: ${passCount}`);
  log(`❌ Failed: ${failCount}`);
  log('');

  // Detailed results
  testResults.forEach(({ test, status, message }) => {
    const icon = status === 'PASS' ? '✅' : '❌';
    log(`${icon} ${test}${message ? `: ${message}` : ''}`);
  });

  log('═══════════════════════════════════════');

  // Exit with appropriate code
  if (failCount > 0) {
    log('');
    log('❌ Tests FAILED. Please review the errors above.');
    exit(1);
  } else {
    log('');
    log('✅ All tests PASSED!');
    exit(0);
  }
}

// Run the tests
runTests().catch((error) => {
  log(`💥 Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  exit(1);
});
