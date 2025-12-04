import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public Routes
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing.component').then(m => m.LandingComponent)
      }
    ]
  },

  // Auth Routes
  {
    path: 'auth',
    loadComponent: () => import('./layouts/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: 'hr-login',
        loadComponent: () => import('./features/auth/hr-login.component').then(m => m.HrLoginComponent)
      },
      {
        path: 'hr-register',
        loadComponent: () => import('./features/auth/hr-register.component').then(m => m.HrRegisterComponent)
      },
      {
        path: 'applicant-login',
        loadComponent: () => import('./features/auth/applicant-login.component').then(m => m.ApplicantLoginComponent)
      },
      {
        path: 'applicant-register',
        loadComponent: () => import('./features/auth/applicant-register.component').then(m => m.ApplicantRegisterComponent)
      }
    ]
  },

  // HR Routes
  {
    path: 'hr',
    loadComponent: () => import('./layouts/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/hr/hr-dashboard.component').then(m => m.HrDashboardComponent)
      }
    ]
  },

  // Applicant Routes
  {
    path: 'applicant',
    loadComponent: () => import('./layouts/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/applicant/applicant-dashboard.component').then(m => m.ApplicantDashboardComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./features/applicant/available-jobs.component').then(m => m.AvailableJobsComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/applicant/my-applications.component').then(m => m.MyApplicationsComponent)
      },
      {
        path: 'applications/:applicationId/:applicantId',
        loadComponent: () => import('./features/applicant/application-details.component').then(m => m.ApplicationDetailsComponent)
      },
      {
        path: 'mock-exams',
        loadComponent: () => import('./features/applicant/mock-exams.component').then(m => m.MockExamsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/applicant/my-profile.component').then(m => m.MyProfileComponent)
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
