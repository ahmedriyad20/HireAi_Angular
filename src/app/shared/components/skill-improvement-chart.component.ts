import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface SkillProgressData {
  skillName: string;
  month: string;
  skillRating: number;
  improvementPercentage: number | null;
}

@Component({
  selector: 'app-skill-improvement-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" style="position: relative; height: 300px;">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
    }
  `]
})
export class SkillImprovementChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() data: SkillProgressData[] = [];
  
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  private initChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.prepareChartData();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private prepareChartData() {
    // Group data by month and skill using improvement percentage
    const monthsMap = new Map<string, Map<string, number>>();
    
    this.data.forEach(item => {
      const monthDate = new Date(item.month);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthsMap.has(monthLabel)) {
        monthsMap.set(monthLabel, new Map());
      }
      
      // Use improvementPercentage instead of skillRating
      const value = item.improvementPercentage !== null ? item.improvementPercentage : 0;
      monthsMap.get(monthLabel)?.set(item.skillName, value);
    });

    // Get unique skill names
    const skillNames = [...new Set(this.data.map(item => item.skillName))];
    const labels = Array.from(monthsMap.keys());

    // Create datasets for each skill
    const colors = [
      '#3A6FF8', // Primary blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#EC4899', // Pink
      '#F97316'  // Orange
    ];

    const datasets = skillNames.map((skillName, index) => ({
      label: skillName,
      data: labels.map(month => {
        const skillData = monthsMap.get(month)?.get(skillName);
        return skillData !== undefined ? skillData : null;
      }),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: colors[index % colors.length],
      pointHoverBorderColor: '#fff',
      fill: false,
      spanGaps: false
    }));

    return { labels, datasets };
  }

  private updateChart(): void {
    if (!this.chart) return;
    
    const chartData = this.prepareChartData();
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets = chartData.datasets;
    this.chart.update();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
