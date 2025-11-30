import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  features = [
    {
      icon: 'file-earmark-text',
      title: 'ATS System',
      description: 'Automated resume parsing and scoring to quickly identify top candidates'
    },
    {
      icon: 'cpu',
      title: 'AI Exams',
      description: 'Generate custom technical assessments powered by AI for accurate evaluation'
    },
    {
      icon: 'graph-up',
      title: 'Analytics Dashboard',
      description: 'Real-time insights and metrics to optimize your recruitment process'
    },
    {
      icon: 'shield-check',
      title: 'Anti-Cheating',
      description: 'Advanced proctoring and cheating detection for fair assessments'
    },
    {
      icon: 'people',
      title: 'Candidate Portal',
      description: 'Self-service dashboard for applicants to track progress and practice'
    },
    {
      icon: 'lightning',
      title: 'Fast Evaluation',
      description: 'Get instant AI-powered candidate rankings and recommendations'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director at TechCorp',
      quote: 'HireAI reduced our time-to-hire by 60%. The AI assessments are incredibly accurate!'
    },
    {
      name: 'Michael Chen',
      role: 'Recruiting Lead at StartupX',
      quote: 'The automated screening saved us hundreds of hours. Best recruitment tool we\'ve used.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Talent Manager at Enterprise Co',
      quote: 'Candidate quality improved significantly. The analytics help us make data-driven decisions.'
    }
  ];

  pricingPlans = [
    {
      name: 'Starter',
      price: '$99',
      description: 'Perfect for small teams',
      popular: false,
      features: [
        'Up to 50 applicants/month',
        'Basic ATS features',
        'AI exam generation',
        'Email support',
        'Basic analytics'
      ]
    },
    {
      name: 'Professional',
      price: '$299',
      description: 'For growing companies',
      popular: true,
      features: [
        'Up to 200 applicants/month',
        'Advanced ATS features',
        'Unlimited AI exams',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'API access'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      popular: false,
      features: [
        'Unlimited applicants',
        'Full feature access',
        'Dedicated account manager',
        '24/7 support',
        'Custom integrations',
        'SLA guarantee',
        'Training & onboarding'
      ]
    }
  ];

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
