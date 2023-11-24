import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { Roles } from '@utils/constants'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'

const ChartComponent:React.FC = () => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE
  const { data: userResponse } = useGetCurrentUserQuery()
  const [rentParts, setRentParts] = useState<number[]>([]);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [colorsArray, setColorsArray] = useState<string[]>([]);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.DOMAIN_ADMIN)
  const isUser = userResponse?.roles?.includes(Roles.USER)
  

  const {
    data: realEstates,
  } = useGetAllRealEstateQuery({})

 

  // const {
  //   data: realEstates,
  // } = useGetAllRealEstateQuery({
  //   domainId: realEstate.domainsFilter[0].value,
  //   limit: isOnPage ? 0 : 5,
  // })


  useEffect(() => {
    const createData = async () => {
      let rentParts: number[] = [];
      let companyNames: string[] = [];
      let total: number = 0;

      for(const element of realEstates.data){
        total= total+element.totalArea
      }

      for (const element of realEstates.data) {
        companyNames.push(element.companyName);
        const elementPartArea = (element.totalArea / total)*100
        rentParts.push(elementPartArea);
      }

      await generateColorsArray(realEstates.data.length);

      setRentParts(rentParts);
      setCompanyNames(companyNames);
    };

    const generateColorsArray = async (length: number) => {
      let initialColors: string[] = ['#b4e4fc', '#e4fcb4', '#fcb4b4', '#fcd8b4', '#d8b4fc'];
      if (length <= 5) {
        initialColors = initialColors.slice(0, length);
      } else {
        const additionalColors = Array.from({ length: length - 5 }, () => getRandomColor());
        initialColors = [...initialColors, ...additionalColors];
      }
      setColorsArray(initialColors);
    };

    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    if (realEstates) {
      createData();
      

    }
    console.log(realEstates)
  }, [realEstates]);

  useEffect(() => {
    let myChart: Chart<"bar" | "line" | "doughnut", number[], string> | null = null;

    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');

        if (ctx) {
          if (myChart) {
            myChart.destroy();
          }

          myChart = new Chart<"bar" | "line" | "doughnut", number[], string>(ctx, {
            type: 'doughnut',
            data: {
              labels: companyNames,
              datasets: [
                {
                  label: 'Відсоток арендованої площі',
                  data: rentParts,
                  backgroundColor: colorsArray,
                  borderColor: colorsArray,
                  borderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right', // Задаємо позицію легенди справа
                },
              },
            },
          });
        }
      }
    };

    createChart();

    const resizeObserver = new ResizeObserver(createChart);

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      if (myChart) {
        myChart.destroy();
      }

      resizeObserver.disconnect();
    };
  }, [realEstates, rentParts, companyNames, colorsArray]);

  return (
    <div style={{ position: 'relative', width: '400px', height: '400px', marginLeft:'20px'}}>
      <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ChartComponent;
