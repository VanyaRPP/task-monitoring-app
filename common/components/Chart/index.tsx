import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import s from './style.module.scss'

const ChartComponent:React.FC <{ names: string[]; values: number[] }>= ({ names, values }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const myChartRef = useRef<Chart<"doughnut", number[], string> | null>(null);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const calculatePercentage = (values: number[]): number[] => {
    const totalArea = values.reduce((sum, element) => sum + element, 0);
    return values.map((element) => (element / totalArea) * 100);
  };

  const generateColorsArray = (length: number): string[] => {
    let initialColors: string[] = ['#b4e4fc', '#e4fcb4', '#fcb4b4', '#fcd8b4', '#d8b4fc'];
    if (length <= 5) {
      initialColors = initialColors.slice(0, length);
    } else {
      const additionalColors = Array.from({ length: length - 5 }, () => getRandomColor());
      initialColors = [...initialColors, ...additionalColors];
    }
    return initialColors;
  };

  const createChart = () => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      myChartRef.current?.destroy();
      myChartRef.current = new Chart<"doughnut", number[], string>(ctx, {
        type: 'doughnut',
        data: {
          labels: names,
          datasets: [
            {
              label: 'Частка площі',
              data: calculatePercentage(values),
              backgroundColor: generateColorsArray(values.length),
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Займані площі',
              font: {
                size: 24,
                family: "'Arial', sans-serif",
                weight: 'bold',
              },
              color: '#722ed1',
            },
          },
        },
      });

      const resizeObserver = new ResizeObserver(() => {
        if (myChartRef.current) {
          myChartRef.current.resize();
        }
      });
  
      resizeObserver.observe(chartRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  };


  useEffect(() => {

    createChart();

  }, [names, values]);

  return (
  <div className={s.chartContainer}>
    <canvas ref={chartRef} className={s.chart} />
  </div>
  );
};
export default ChartComponent;
