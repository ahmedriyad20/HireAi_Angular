import { Routes } from '@angular/router';
import { loginGuard } from './core/guards/login.guard';

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
    canActivate: [loginGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'hr-register',
        loadComponent: () => import('./features/auth/hr-register.component').then(m => m.HrRegisterComponent)
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
      },
      {
        path: 'jobs',
        loadComponent: () => import('./features/hr/hr-jobs.component').then(m => m.HrJobsComponent)
      },
      {
        path: 'jobs/create',
        loadComponent: () => import('./features/hr/hr-create-job.component').then(m => m.HrCreateJobComponent)
      },
      {
        path: 'jobs/:jobId/edit',
        loadComponent: () => import('./features/hr/hr-update-job.component').then(m => m.HrUpdateJobComponent)
      },
      {
        path: 'jobs/:jobId',
        loadComponent: () => import('./features/hr/hr-job-details.component').then(m => m.HrJobDetailsComponent)
      },
      {
        path: 'applicants',
        loadComponent: () => import('./features/hr/hr-applicants.component').then(m => m.HrApplicantsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/hr/hr-profile.component').then(m => m.HrProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/applicant/account-settings.component').then(m => m.AccountSettingsComponent)
      }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: 'applicants',
        loadComponent: () => import('./features/admin/admin-all-applicants.component').then(m => m.AdminAllApplicantsComponent)
      },
      {
        path: 'hrs',
        loadComponent: () => import('./features/admin/admin-all-hrs.component').then(m => m.AdminAllHRsComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./features/admin/admin-all-jobs.component').then(m => m.AdminAllJobsComponent)
      },
      {
        path: '',
        redirectTo: 'applicants',
        pathMatch: 'full'
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
        path: 'jobs/:jobId',
        loadComponent: () => import('./features/applicant/job-details.component').then(m => m.JobDetailsComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/applicant/my-applications.component').then(m => m.MyApplicationsComponent)
      },
      {
        path: 'applications/:applicationId',
        loadComponent: () => import('./features/applicant/application-details.component').then(m => m.ApplicationDetailsComponent)
      },
      {
        path: 'job-exam/:applicationId',
        loadComponent: () => import('./features/applicant/job-exam.component').then(m => m.JobExamComponent)
      },
      {
        path: 'exam-results',
        loadComponent: () => import('./features/applicant/exam-results.component').then(m => m.ExamResultsComponent)
      },
      {
        path: 'mock-exams',
        loadComponent: () => import('./features/applicant/mock-exams.component').then(m => m.MockExamsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/applicant/my-profile.component').then(m => m.MyProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/applicant/account-settings.component').then(m => m.AccountSettingsComponent)
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
