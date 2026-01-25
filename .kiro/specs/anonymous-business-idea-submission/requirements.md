# Requirements Document

## Introduction

This feature enables non-logged-in (anonymous) users to submit business ideas to the platform. Currently, only authenticated admin users can create business ideas. This enhancement democratizes the platform by allowing anyone to contribute ideas, while maintaining quality through a moderation workflow. Anonymous submissions will require admin approval before appearing publicly, and a separate admin interface will manage these pending submissions.

## Glossary

- **Anonymous User**: A user who accesses the platform without authentication credentials
- **Business Idea Submission**: A proposal containing title, description, images, and budget information submitted by an anonymous user
- **Moderation Queue**: A collection of pending business idea submissions awaiting admin review
- **Submission System**: The backend service that handles anonymous business idea submissions
- **Admin Moderation Interface**: The administrative UI for reviewing, approving, or rejecting anonymous submissions
- **Public Business Idea**: An approved business idea visible to all users on the platform
- **Rate Limiter**: A mechanism that restricts the number of submissions from a single source within a time period
- **Contact Information**: Optional email or phone number provided by anonymous submitters for follow-up

## Requirements

### Requirement 1

**User Story:** As an anonymous user, I want to submit a business idea without creating an account, so that I can share my ideas quickly without authentication barriers.

#### Acceptance Criteria

1. WHEN an anonymous user accesses the submission form THEN the System SHALL display all required fields without requiring authentication
2. WHEN an anonymous user submits a business idea with valid data THEN the Submission System SHALL create a pending submission record
3. WHEN an anonymous user submits a business idea THEN the Submission System SHALL store the submission with a PENDING status
4. WHEN an anonymous submission is created THEN the Submission System SHALL NOT display it in the public business ideas list
5. WHERE an anonymous user provides contact information THEN the Submission System SHALL store it securely for admin follow-up

### Requirement 2

**User Story:** As an anonymous user, I want to receive immediate feedback after submitting my idea, so that I know my submission was received and understand the next steps.

#### Acceptance Criteria

1. WHEN an anonymous user successfully submits a business idea THEN the System SHALL display a confirmation message indicating the submission is pending review
2. WHEN a submission fails validation THEN the System SHALL display specific error messages for each invalid field
3. WHEN a submission is rate-limited THEN the System SHALL display a message indicating the user has exceeded submission limits
4. WHEN a submission succeeds THEN the System SHALL provide an estimated review timeframe to the user

### Requirement 3

**User Story:** As an admin, I want to view all pending anonymous submissions in a dedicated interface, so that I can efficiently review and moderate incoming ideas.

#### Acceptance Criteria

1. WHEN an admin accesses the moderation queue THEN the Admin Moderation Interface SHALL display all pending submissions ordered by submission date
2. WHEN displaying pending submissions THEN the Admin Moderation Interface SHALL show title, description preview, submission date, and contact information
3. WHEN an admin selects a pending submission THEN the Admin Moderation Interface SHALL display the complete submission details including all images
4. WHEN the moderation queue is empty THEN the Admin Moderation Interface SHALL display a message indicating no pending submissions

### Requirement 4

**User Story:** As an admin, I want to approve anonymous submissions, so that quality ideas can be published to the platform.

#### Acceptance Criteria

1. WHEN an admin approves a pending submission THEN the Submission System SHALL create a public business idea with the submission data
2. WHEN a submission is approved THEN the Submission System SHALL remove it from the moderation queue
3. WHEN a submission is approved THEN the Submission System SHALL preserve all associated images and metadata
4. WHEN a submission is approved THEN the Submission System SHALL set the creation timestamp to the approval time

### Requirement 5

**User Story:** As an admin, I want to reject anonymous submissions with optional feedback, so that I can filter out inappropriate or low-quality ideas.

#### Acceptance Criteria

1. WHEN an admin rejects a pending submission THEN the Submission System SHALL mark it as REJECTED
2. WHEN an admin rejects a submission THEN the Submission System SHALL remove it from the active moderation queue
3. WHERE an admin provides rejection feedback THEN the Submission System SHALL store the feedback with the rejected submission
4. WHEN a submission is rejected THEN the Submission System SHALL retain the record for audit purposes

### Requirement 6

**User Story:** As an admin, I want to edit anonymous submissions before approval, so that I can correct minor issues without rejecting the entire submission.

#### Acceptance Criteria

1. WHEN an admin edits a pending submission THEN the Admin Moderation Interface SHALL allow modification of title, description, and budget fields
2. WHEN an admin saves edits to a pending submission THEN the Submission System SHALL update the submission data
3. WHEN an admin edits a submission THEN the Submission System SHALL preserve the original submission timestamp
4. WHEN an admin edits a submission THEN the Submission System SHALL log the modification for audit purposes

### Requirement 7

**User Story:** As a system administrator, I want to prevent spam submissions, so that the moderation queue remains manageable and the platform maintains quality.

#### Acceptance Criteria

1. WHEN an anonymous user submits multiple ideas THEN the Rate Limiter SHALL restrict submissions to 3 per IP address per 24-hour period
2. WHEN a rate limit is exceeded THEN the Submission System SHALL reject the submission with a clear error message
3. WHEN detecting suspicious patterns THEN the Submission System SHALL flag submissions for additional admin review
4. WHEN a submission contains prohibited content patterns THEN the Submission System SHALL automatically flag it for review

### Requirement 8

**User Story:** As an admin, I want to see submission statistics and trends, so that I can understand platform engagement and adjust moderation resources.

#### Acceptance Criteria

1. WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of pending submissions
2. WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of approved submissions in the last 30 days
3. WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the count of rejected submissions in the last 30 days
4. WHEN an admin views the moderation dashboard THEN the Admin Moderation Interface SHALL display the average review time for submissions

### Requirement 9

**User Story:** As an admin, I want to filter and search pending submissions, so that I can efficiently manage large volumes of submissions.

#### Acceptance Criteria

1. WHEN an admin applies a date range filter THEN the Admin Moderation Interface SHALL display only submissions within that range
2. WHEN an admin searches by keyword THEN the Admin Moderation Interface SHALL display submissions matching the title or description
3. WHEN an admin filters by contact status THEN the Admin Moderation Interface SHALL display submissions with or without contact information
4. WHEN filters are applied THEN the Admin Moderation Interface SHALL update the submission count accordingly

### Requirement 10

**User Story:** As a developer, I want clear separation between anonymous submissions and admin-created business ideas, so that the system remains maintainable and auditable.

#### Acceptance Criteria

1. WHEN storing submissions THEN the Submission System SHALL use a separate database table for pending anonymous submissions
2. WHEN a submission is approved THEN the Submission System SHALL migrate data to the public business ideas table
3. WHEN querying public business ideas THEN the System SHALL NOT include pending or rejected anonymous submissions
4. WHEN auditing submissions THEN the System SHALL maintain a complete history of submission status changes
