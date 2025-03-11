import React, { forwardRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = forwardRef(({ title, labels, data }, ref) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: labels.map((label) => data[label]),
        backgroundColor: "#3941ff",
        hoverBackgroundColor: "#2C36CC",
        barThickness: 50, // Fixed bar width
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { display: false }, // Remove horizontal grid lines
      },
      x: {
        grid: { display: false }, // Remove vertical grid lines
      },
    },
  };

  return <Bar ref={ref} data={chartData} options={options} />;
});

export default BarChart;
