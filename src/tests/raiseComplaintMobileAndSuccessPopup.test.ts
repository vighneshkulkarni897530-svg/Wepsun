import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== Starting Verification: Raise a Service Request Mobile Scrolling & Success Popup ===');

// 1. Verify RaiseComplaintModal.tsx implementation
const modalPath = path.resolve('src/components/client/RaiseComplaintModal.tsx');
assert(fs.existsSync(modalPath), 'RaiseComplaintModal.tsx must exist');
const modalSource = fs.readFileSync(modalPath, 'utf8');

console.log('Test 1: Mobile Layout Structure & Scrollable Form...');
assert(modalSource.includes('shrink-0 bg-white border-b border-slate-200'), 'Header must be fixed/shrink-0 at top');
assert(modalSource.includes('Raise a Service Request'), 'Page heading "Raise a Service Request" must be present');
assert(modalSource.includes('scrollContainerRef'), 'Single scroll container ref must be present');
assert(modalSource.includes('overflow-y-auto overscroll-contain touch-pan-y'), 'Form container must have vertical touch scrolling without scroll chaining');
assert(modalSource.includes('pb-[calc(104px+env(safe-area-inset-bottom,20px))]'), 'Scroll container must have bottom padding accounting for mobile nav and safe-area inset');
assert(modalSource.includes('Submit Complaint'), 'Submit Complaint button must exist');
assert(modalSource.includes('Cancel'), 'Cancel button must exist');
console.log('✓ Test 1 Passed: Mobile scrolling layout and bottom padding verified.');

console.log('Test 2: Mobile Virtual Keyboard Handling & iOS Auto-Zoom Prevention...');
assert(modalSource.includes('visualViewport'), 'Must listen to visualViewport resize for virtual keyboard handling');
assert(modalSource.includes('text-base sm:text-xs'), 'Inputs/textareas must use 16px minimum on mobile to prevent iOS Safari auto-zoom');
assert(modalSource.includes('scrollIntoView'), 'Inputs must scroll active element into view on focus');
console.log('✓ Test 2 Passed: Keyboard and viewport handling verified.');

console.log('Test 3: Backend Submission & Sequence Validation...');
assert(modalSource.includes('createComplaintAsync'), 'Must support async backend submission via createComplaintAsync');
assert(modalSource.includes('trimmedDesc.length < 5'), 'Must validate minimum description length');
assert(modalSource.includes('setSubmitError'), 'Must track submission errors for user retry');
assert(modalSource.includes('isSubmitting'), 'Must prevent duplicate submissions with disabled state & loading indicator');
assert(modalSource.includes('Registering Complaint...'), 'Must show loading feedback while submitting');
console.log('✓ Test 3 Passed: Validation and backend submission sequence verified.');

console.log('Test 4: Attractive Complaint Submission Success Popup...');
assert(modalSource.includes('Complaint Raised Successfully!'), 'Heading "Complaint Raised Successfully!" must be present');
assert(modalSource.includes('Your service complaint has been submitted successfully. Our team will review your request and take the necessary action.'), 'Required success message must be present');
assert(modalSource.includes('animate-ping'), 'Animated pulse/ring effect must be present for checkmark');
assert(modalSource.includes('CheckCircle2'), 'Green checkmark icon must be present');
assert(modalSource.includes('Ticket / Complaint ID:'), 'Ticket / Complaint ID label must be present');
assert(modalSource.includes('Selected Lift:'), 'Selected lift display must be present');
assert(modalSource.includes('Complaint Type:'), 'Complaint type display must be present');
assert(modalSource.includes('Priority:'), 'Priority display must be present');
assert(modalSource.includes('View Complaint'), 'View Complaint button must be present');
assert(modalSource.includes('Back to Home'), 'Back to Home button must be present');
console.log('✓ Test 4 Passed: Success popup design and elements verified.');

console.log('Test 5: Navigation & Highlighting Integration...');
assert(modalSource.includes('wepsun_highlight_ticket'), 'Must store ticket ID in sessionStorage for auto-expansion');
const complaintsViewPath = path.resolve('src/components/client/ClientComplaintsView.tsx');
const complaintsViewSource = fs.readFileSync(complaintsViewPath, 'utf8');
assert(complaintsViewSource.includes('wepsun_highlight_ticket'), 'ClientComplaintsView must consume highlighted ticket');
assert(complaintsViewSource.includes('complaint-card-'), 'Complaint card must have unique ID for smooth scrolling');
console.log('✓ Test 5 Passed: Navigation and ticket auto-expansion verified.');

console.log('Test 6: AppContext Integration...');
const appContextPath = path.resolve('src/context/AppContext.tsx');
const appContextSource = fs.readFileSync(appContextPath, 'utf8');
assert(appContextSource.includes('createComplaintAsync: (complaintData: Partial<Complaint>) => Promise<Complaint>'), 'AppContextType must expose createComplaintAsync');
assert(appContextSource.includes('const createComplaintAsync = async'), 'AppContext must implement createComplaintAsync');
assert(appContextSource.includes('createComplaintAsync,'), 'AppContext value must export createComplaintAsync');
console.log('✓ Test 6 Passed: AppContext async persistence verified.');

console.log('=== All 6 Verification Tests Passed Successfully! ===');

