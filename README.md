# Hospital Management System (HMS)

A modern, responsive web application for comprehensive hospital management with intuitive UI/UX design.

## Features

### Core Modules

1. **Reception Management** - Handle patient check-ins, appointments, and queue management
2. **Patient Registration** - Register new patients and maintain detailed medical records
3. **Out Patient Department (OPD)** - Manage OPD consultations, treatments, and follow-ups
4. **OPD Billing** - Generate invoices, track payments, and manage financial records
5. **Investigations & Lab** - Register and track lab tests, manage reports

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **State Management**: React hooks with localStorage persistence
- **Language**: TypeScript
- **Styling**: Professional healthcare color scheme (Blue/Teal)
- **Responsive**: Mobile-first design, works on all devices

## Getting Started

### Installation

1. Clone or download the project
2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
hospital-management-system/
├── app/
│   ├── page.tsx                 # Dashboard
│   ├── reception/              # Reception Management
│   ├── registration/           # Patient Registration
│   ├── outpatient/            # OPD Management
│   ├── billing/               # Billing Module
│   ├── investigations/        # Lab & Investigations
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── layout/              # Layout components (Sidebar, Header)
│   ├── dashboard/          # Dashboard components
│   ├── common/            # Reusable components
│   └── ui/               # shadcn/ui components
├── hooks/
│   └── use-local-storage.ts    # Data persistence hook
├── lib/
│   ├── utils.ts           # Utility functions
│   ├── validation.ts      # Form validation
│   └── export-utils.ts    # Export/print utilities
└── public/                # Static assets
```

## Module Overview

### Dashboard
- Real-time statistics and metrics
- Recent activity feed
- Quick action shortcuts
- Module overview cards

### Reception Management
- Patient check-in system
- Status tracking (Waiting, In Consultation, Completed)
- Doctor assignment
- Search and filter capabilities

### Patient Registration
- Comprehensive patient profiles
- Medical history tracking
- Contact information
- Blood group and allergies
- Edit and delete capabilities

### OPD Management
- Case creation and tracking
- Doctor and department assignment
- Symptoms and diagnosis documentation
- Treatment planning
- Follow-up scheduling

### OPD Billing
- Automated invoice generation
- Itemized billing breakdown
- Payment status tracking
- Financial summaries and reports

### Investigations
- Lab test registration
- Multiple test types support
- Results tracking
- Report generation

## Design Highlights

- **Professional Color Scheme**: Blue and teal colors for healthcare
- **Responsive Layout**: Works seamlessly on mobile, tablet, and desktop
- **Dark Mode Support**: Automatic dark theme handling
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized components and lazy loading
- **Real-time Updates**: Instant data persistence with localStorage

## Features

✓ Complete CRUD operations for all modules
✓ Search and filter functionality
✓ Real-time status updates
✓ Data export and printing
✓ Form validation and error handling
✓ Loading states and skeletons
✓ Empty state handling
✓ Responsive design
✓ Dark/Light mode support
✓ Professional healthcare design

## Data Persistence

All data is stored in the browser's localStorage, allowing:
- Persistent data across sessions
- Offline functionality
- Quick data access without backend

*Note: This is frontend-only for demonstration. Connect to a backend API for production use.*

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Backend API integration
- Authentication and authorization
- User role-based access control
- Real-time notifications
- Advanced reporting and analytics
- Appointment scheduling system
- Payment gateway integration
- Email/SMS notifications

## Development

### Available Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Performance Tips

- The app loads and runs completely in the browser
- Use browser DevTools for performance profiling
- Clear localStorage if you want to reset all data

## Support

For detailed documentation, see:
- `FEATURES.md` - Complete feature list
- `PROJECT_SUMMARY.md` - Technical overview
- `QUICKSTART.md` - Quick start guide
- `MODULES_OVERVIEW.md` - Detailed module architecture

## License

This project is provided as-is for educational and commercial use.

---

Built with ❤️ for modern hospital management
