# My Profile Component - Documentation

## Overview
The **My Profile** component is a modern, animated, and fully responsive UI for displaying applicant profile information. It fetches data from the backend API and presents it in an engaging, interactive interface with smooth animations and a professional design.

## Features

### 1. **Responsive Design**
- Mobile-first approach
- Adapts seamlessly to all screen sizes (desktop, tablet, mobile)
- Grid-based layout using CSS Grid and Flexbox
- Touch-friendly interactive elements

### 2. **Smooth Animations**
- **Fade In**: Smooth opacity transitions
- **Slide Up/Right**: Elements slide in from top/side
- **Scale In**: Cards scale up on load
- **Pulse Effect**: Status indicator pulses
- **Glow Effect**: Header background creates ambient glow
- **Fill Progress**: Skill bars animate with smooth fill effect

### 3. **Tabbed Interface**
- **Overview Tab**: Personal information, bio, resume download
- **Skills Tab**: Visual skill cards with progress bars
- **Activity Tab**: User account history and milestones

### 4. **Key Sections**

#### Profile Header
- Large animated avatar with initial letter
- Active/Inactive status badge with animation
- Profile name, title, and contact information
- Gradient background with decorative elements
- Responsive layout that stacks on mobile

#### Overview Tab
- **Bio Card**: Short professional bio
- **Personal Info Card**: Birth date, skill level, member since, last login
- **Resume Card**: Download resume with action button

#### Skills Tab
- **Skill Cards**: One card per skill with:
  - Skill name and proficiency percentage
  - Animated progress bar (color-coded by level)
  - Level badge (Beginner, Intermediate, Advanced, Expert)
  - Smooth hover effects
  - Staggered animation on load

#### Activity Tab
- **Timeline-style layout** showing:
  - Account creation date
  - Last login time
  - Number of skills added
  - Current account status
- Color-coded activity icons
- Smooth slide animations with staggered delays

### 5. **Color Coding**
- **Success (Green)**: Expert level skills (80%+)
- **Info (Cyan)**: Advanced level skills (60-79%)
- **Warning (Yellow)**: Intermediate level skills (40-59%)
- **Danger (Red)**: Beginner level skills (<40%)

### 6. **Interactive Elements**
- Hover effects on cards and buttons
- Tab switching with smooth transitions
- Active state indicators on tab navigation
- Loading spinner while fetching data
- Error handling with user-friendly messages

## Technical Details

### API Endpoint
```
GET http://localhost:5290/api/Applicant/{applicantId}
```

**Response Structure:**
```json
{
  "id": number,
  "name": string,
  "email": string,
  "dateOfBirth": string (ISO format),
  "phone": string,
  "bio": string,
  "title": string,
  "isActive": boolean,
  "lastLogin": string (ISO format),
  "createdAt": string (ISO format),
  "resumeUrl": string (URL),
  "skillLevel": string,
  "applicantSkills": [
    {
      "id": number,
      "skillId": number,
      "skillName": string,
      "skillRate": number (0-100),
      "improvementPercentage": number | null,
      "notes": string | null
    }
  ]
}
```

### Files Created
1. **my-profile.component.ts** - Component logic
2. **my-profile.component.html** - Template structure
3. **my-profile.component.css** - Styling and animations
4. **applicant-profile.model.ts** - TypeScript interfaces
5. **applicant-profile.service.ts** - HTTP service

### Route Configuration
```typescript
{
  path: 'my-profile',
  loadComponent: () => import('./features/applicant/my-profile.component').then(m => m.MyProfileComponent)
}
```

**Access via:** `/applicant/my-profile`

## Component Architecture

### Dependencies
- Angular 20.3.0
- Bootstrap 5.3.3 (for utilities and responsive grid)
- Bootstrap Icons 1.13.1 (for icons)
- RxJS (for reactive programming)

### Key Components

#### TypeScript Component (`my-profile.component.ts`)
- **Properties:**
  - `profile`: ApplicantProfile data object
  - `loading`: Boolean for loading state
  - `error`: Error message string
  - `activeTab`: Currently active tab
  - `destroy$`: Subject for cleanup

- **Methods:**
  - `loadProfile()`: Fetches profile from API
  - `setActiveTab()`: Switches between tabs
  - `getSkillColor()`: Returns color based on skill rate
  - `getAgeFromDateOfBirth()`: Calculates age
  - `formatDate()`: Formats dates for display
  - `downloadResume()`: Opens resume in new tab

#### Lifecycle Hooks
- `ngOnInit()`: Initializes component and loads profile
- `ngOnDestroy()`: Cleans up subscriptions

### CSS Features

#### Animations
- **@keyframes**: 7 custom animations for different effects
- **Staggered animations**: Elements animate sequentially
- **Hover states**: Interactive feedback for user actions
- **CSS transitions**: Smooth property changes

#### Layout
- **CSS Grid**: For cards and skills layout
- **Flexbox**: For alignment and spacing
- **Media queries**: Responsive breakpoints at 768px and 576px

#### Color Variables
```css
--primary-color: #0d6efd
--secondary-color: #6c757d
--success-color: #198754
--danger-color: #dc3545
--warning-color: #ffc107
--info-color: #0dcaf0
--light-bg: #f8f9fa
--border-color: #dee2e6
```

## Usage

### Navigation
1. User logs in as applicant
2. Navigate to `/applicant/my-profile`
3. Component automatically loads profile data
4. Switch between tabs to view different sections

### Data Flow
```
Component Init
    ↓
loadProfile() called
    ↓
ApplicantProfileService.getApplicantProfile(2)
    ↓
HTTP GET request to API
    ↓
Response received
    ↓
Display data with animations
```

## Customization

### Changing Applicant ID
In `my-profile.component.ts`, modify:
```typescript
this.profileService.getApplicantProfile(2)  // Change 2 to desired ID
```

Or better, inject it from route params:
```typescript
constructor(private route: ActivatedRoute, private profileService: ApplicantProfileService) {
  this.applicantId = this.route.snapshot.paramMap.get('id');
}
```

### Animation Speed
Modify animation durations in CSS:
```css
animation: fadeIn 0.4s ease-in-out;  /* Change 0.4s to desired duration */
```

### Color Scheme
Update CSS variables to match your brand:
```css
:host {
  --primary-color: #your-color;
  /* ... other colors ... */
}
```

## Browser Support
- Chrome (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Considerations
- **Lazy loading**: Component is lazy-loaded via route
- **OnPush detection**: Can be added for better performance
- **Unsubscribe**: Uses takeUntil to prevent memory leaks
- **CSS animations**: Hardware accelerated for smooth performance

## Future Enhancements
1. Edit profile functionality
2. Upload profile picture
3. Add/remove skills
4. Update personal information
5. Change password
6. Export profile as PDF
7. Share profile link
8. Two-factor authentication settings
9. Activity history pagination
10. Dark mode support

## Error Handling
- Graceful error messages for API failures
- Retry button on error state
- Console logging for debugging
- User-friendly error display

## Accessibility Features
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators on interactive elements

## Testing Recommendations
1. Test with sample data
2. Verify animations on different devices
3. Test responsive behavior
4. Check accessibility with screen readers
5. Verify error handling
6. Test loading states
