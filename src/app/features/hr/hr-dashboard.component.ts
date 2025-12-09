import { Component, signal, OnInit, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCardComponent, StatCardData } from '../../shared/components/stat-card.component';
import { HRDashboardService } from '../../core/services/hr-dashboard.service';
import { HRDashboardData, RecentApplication, ActiveJobPosting } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.css']
})
export class HrDashboardComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(HRDashboardService);
  private authService = inject(AuthService);

  @ViewChild('monthlyApplicantsChart') monthlyApplicantsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('atsPassedChart') atsPassedChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('examScoreChart') examScoreChartRef!: ElementRef<HTMLCanvasElement>;

  private monthlyApplicantsChart?: Chart;
  private atsPassedChart?: Chart;
  private examScoreChart?: Chart;

  dashboardData = signal<HRDashboardData | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeTab = signal<'recent' | 'active'>('recent');
  statsData = signal<StatCardData[]>([
    {
      label: 'Total Applicants',
      value: '0',
      icon: 'people',
      iconColor: 'primary'
    },
    {
      label: 'ATS Pass Rate',
      value: '0%',
      icon: 'check-circle',
      iconColor: 'success'
    },
    {
      label: 'Exams Taken',
      value: '0',
      icon: 'clipboard-check',
      iconColor: 'indigo'
    },
    {
      label: 'Top Candidates',
      value: '0',
      icon: 'star',
      iconColor: 'warning'
    }
  ]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('User ID not found');
      this.error.set('User not authenticated. Please login again.');
      this.isLoading.set(false);
      return;
    }
    
    const hrId = parseInt(userId, 10);
    
    this.dashboardService.getDashboardData(hrId).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.updateStatsData(data);
        this.isLoading.set(false);
        // Initialize charts after data is loaded and view is ready
        setTimeout(() => this.initializeCharts(data), 0);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        if (error.status === 403) {
          this.error.set('Access denied. You do not have permission to view this dashboard.');
        } else if (error.status === 401) {
          this.error.set('Session expired. Please login again.');
        } else {
          this.error.set('Failed to load dashboard data. Please try again.');
        }
        this.isLoading.set(false);
      }
    });
  }

  updateStatsData(data: HRDashboardData): void {
    this.statsData.set([
      {
        label: 'Total Applicants',
        value: data.totalApplicants.toString(),
        icon: 'people',
        iconColor: 'primary'
      },
      {
        label: 'ATS Pass Rate',
        value: `${data.atsPassedRate}%`,
        icon: 'check-circle',
        iconColor: 'success'
      },
      {
        label: 'Exams Taken',
        value: data.totalExamTaken.toString(),
        icon: 'clipboard-check',
        iconColor: 'indigo'
      },
      {
        label: 'Top Candidates',
        value: data.totalTopApplicants.toString(),
        icon: 'star',
        iconColor: 'warning'
      }
    ]);
  }

  initializeCharts(data: HRDashboardData): void {
    this.createMonthlyApplicantsChart(data.monthlyApplicants);
    this.createAtsPassedChart(data.atsPassedRateMonthly);
    this.createExamScoreChart(data.examScoreDistribution);
  }

  createMonthlyApplicantsChart(monthlyData: { [key: string]: number }): void {
    if (this.monthlyApplicantsChart) {
      this.monthlyApplicantsChart.destroy();
    }

    const months = Object.keys(monthlyData).sort((a, b) => parseInt(a) - parseInt(b));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = months.map(m => monthNames[parseInt(m) - 1]);
    const values = months.map(m => monthlyData[m]);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Applicants',
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Monthly Applicants',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.monthlyApplicantsChart = new Chart(this.monthlyApplicantsChartRef.nativeElement, config);
  }

  createAtsPassedChart(atsData: { [key: string]: number }): void {
    if (this.atsPassedChart) {
      this.atsPassedChart.destroy();
    }

    const months = Object.keys(atsData).sort((a, b) => parseInt(a) - parseInt(b));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = months.map(m => monthNames[parseInt(m) - 1]);
    const values = months.map(m => atsData[m]);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ATS Passed Applicants',
          data: values,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Monthly ATS Pass Rate',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.atsPassedChart = new Chart(this.atsPassedChartRef.nativeElement, config);
  }

  createExamScoreChart(scoreData: { [key: string]: number }): void {
    if (this.examScoreChart) {
      this.examScoreChart.destroy();
    }

    const labels = Object.keys(scoreData);
    const values = Object.values(scoreData);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Distribution %',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(54, 162, 235, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right'
          },
          title: {
            display: true,
            text: 'Exam Score Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.toFixed(2)}%`;
              }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.examScoreChart = new Chart(this.examScoreChartRef.nativeElement, config);
  }

  switchTab(tab: 'recent' | 'active'): void {
    this.activeTab.set(tab);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  retryLoad(): void {
    this.loadDashboardData();
  }
}
