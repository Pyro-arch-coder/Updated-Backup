import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from 'xlsx';
import { Box, Typography, TextField, Button, Alert, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Define API base URL with environment variable and fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const Dashboard = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const chartsRef = useRef([]);
  
  // Get admin info from localStorage
  const [adminInfo, setAdminInfo] = useState(() => {
    const id = localStorage.getItem('id');
    const barangay = localStorage.getItem('barangay');
    console.log('Admin Info from localStorage:', { id, barangay });
    return { id, barangay };
  });
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    population: Array(12).fill(0),
    monthlyRemarks: Array(12).fill(0),
    genderDistribution: [
      { name: 'Female', value: 0 },
      { name: 'Male', value: 0 },
      { name: 'LGBTQ+', value: 0 }
    ],
    employmentStatus: [
      { name: 'Employed', value: 0 },
      { name: 'Self-employed', value: 0 },
      { name: 'Not employed', value: 0 }
    ]
  });
  
  // State for solo parent age data
  const [soloParentAgeData, setSoloParentAgeData] = useState({
    rawData: [],
    ageGroups: {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0
    }
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reportCount, setReportCount] = useState(() => {
    const count = parseInt(localStorage.getItem('admin_report_count') || '0', 10);
    return isNaN(count) ? 0 : count;
  });
  const [reportLimitMessage, setReportLimitMessage] = useState('');
  const [exportFilter, setExportFilter] = useState('all');

  // Add useEffect to fetch admin info if not in localStorage
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const adminId = localStorage.getItem('id');
        if (!adminId) {
          console.error('No admin ID found in localStorage');
          return;
        }

        const response = await fetch(`${API_URL}/admin-info?id=${adminId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch admin info');
        }
        const data = await response.json();
        console.log('Fetched admin info:', data);
        
        // Update localStorage with the fetched barangay
        localStorage.setItem('barangay', data.barangay);
        
        // Update state with the fetched data
        setAdminInfo({
          id: data.id,
          barangay: data.barangay
        });
      } catch (error) {
        console.error('Error fetching admin info:', error);
      }
    };

    fetchAdminInfo();
  }, []);

  // Update the dashboard title to handle undefined barangay
  const dashboardTitle = adminInfo.barangay ? `${adminInfo.barangay} Dashboard` : 'Loading Dashboard...';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data for admin:', adminInfo);
        if (!adminInfo.id) {
          console.error('No admin ID found');
          setLoading(false);
          return;
        }

        // Build query string with date filters
        let queryString = `adminId=${adminInfo.id}`;
        if (startDate && endDate) {
          queryString += `&startDate=${startDate}&endDate=${endDate}`;
        }

        // Fetch population data for admin's barangay
        const populationResponse = await fetch(`${API_URL}/admin-population-users?${queryString}`);
        if (!populationResponse.ok) {
          throw new Error(`HTTP error! status: ${populationResponse.status}`);
        }
        const populationData = await populationResponse.json();
        console.log('Population data:', populationData);

        // Fetch remarks data
        const remarksResponse = await fetch(`${API_URL}/remarks-users?${queryString}`);
        if (!remarksResponse.ok) {
          throw new Error(`HTTP error! status: ${remarksResponse.status}`);
        }
        const remarksData = await remarksResponse.json();
        
        // Fetch children age data for solo parents in the barangay
        const barangayParam = adminInfo.barangay ? `barangay=${adminInfo.barangay}` : '';
        let ageQueryString = barangayParam;
        if (startDate && endDate) {
          ageQueryString += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        // Add filter to get only children of solo parents
        ageQueryString += '&soloParentsOnly=true';
        
        const ageResponse = await fetch(`${API_URL}/children-age-data?${ageQueryString}`);
        if (!ageResponse.ok) {
          console.error(`Error fetching children age data: ${ageResponse.status}`);
        } else {
          const ageData = await ageResponse.json();
          console.log('Children age data:', ageData);
          setAgeData(ageData);
        }
        
        // Fetch children count data
        const childrenCountResponse = await fetch(`${API_URL}/children-count-data?${ageQueryString}`);
        if (!childrenCountResponse.ok) {
          console.error(`Error fetching children count data: ${childrenCountResponse.status}`);
        } else {
          const childrenData = await childrenCountResponse.json();
          console.log('Children count data:', childrenData);
          setChildrenCountData(childrenData);
        }
        
        // Fetch solo parent age data
        const soloParentAgeResponse = await fetch(`${API_URL}/solo-parent-age-data?${ageQueryString}`);
        if (!soloParentAgeResponse.ok) {
          console.error(`Error fetching solo parent age data: ${soloParentAgeResponse.status}`);
        } else {
          const soloParentData = await soloParentAgeResponse.json();
          console.log('Solo parent age data:', soloParentData);
          setSoloParentAgeData(soloParentData);
        }
        
        // Process the data
        const monthlyData = Array(12).fill(0);
        const monthlyRemarksData = Array(12).fill(0);
        const genderCounts = { Female: 0, Male: 0, 'LGBTQ+': 0 };
        const employmentCounts = { 
          'Employed': 0, 
          'Self-employed': 0, 
          'Not employed': 0 
        };

        // Process population data
        populationData.forEach(user => {
          const date = new Date(user.accepted_at);
          const month = date.getMonth();
          monthlyData[month]++;

          // Count gender
          const gender = standardizeGender(user.gender);
          if (gender) {
            genderCounts[gender] = (genderCounts[gender] || 0) + 1;
          }

          // Count employment status
          const status = standardizeEmploymentStatus(user.employment_status);
          employmentCounts[status] = (employmentCounts[status] || 0) + 1;
        });

        // Process remarks data
        remarksData.forEach(remark => {
          const date = new Date(remark.remarks_at);
          const month = date.getMonth();
          monthlyRemarksData[month]++;
        });

        console.log('Gender counts:', genderCounts);

        // Update dashboard data
        setDashboardData({
          population: monthlyData,
          monthlyRemarks: monthlyRemarksData,
          genderDistribution: Object.entries(genderCounts).map(([name, value]) => ({ 
            name, 
            value,
            itemStyle: {
              color: name === 'Female' ? '#FF69B4' : name === 'Male' ? '#4169E1' : '#9370DB'
            }
          })),
          employmentStatus: Object.entries(employmentCounts).map(([name, value]) => ({ name, value }))
        });

        // Add a small delay before setting loading to false
        setTimeout(() => {
          setLoading(false);
        }, 100);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (adminInfo.id) {
      fetchDashboardData();
    } else {
      console.error('No admin ID found, skipping data fetch');
      setLoading(false);
    }
  }, [adminInfo.id, startDate, endDate]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      chartsRef.current.forEach(chart => {
        if (chart) {
          chart.getEchartsInstance().resize();
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Population Growth Chart
  const populationOption = {
    title: {
      text: 'Population Growth',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line'
      }
    },
    grid: {
      top: 40,
      left: '8%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10,
        interval: windowWidth < 480 ? 2 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Population (${adminInfo.barangay})` : 'Population',
      type: 'line',
      smooth: false,
      symbol: 'circle',
      symbolSize: 4,
      data: dashboardData.population,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(22, 196, 127, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(22, 196, 127, 0.05)'
          }]
        }
      },
      lineStyle: {
        width: 2,
        color: '#16C47F'
      },
      itemStyle: {
        color: '#16C47F',
        borderWidth: 2
      }
    }]
  };

  // Monthly Registrations Chart
  const remarksOption = {
    title: {
      text: 'Monthly Remarks',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      top: 40,
      left: '12%',
      right: '5%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10,
        interval: windowWidth < 480 ? 2 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Remarks (${adminInfo.barangay})` : 'Remarks',
      type: 'bar',
      barWidth: '40%',
      data: dashboardData.monthlyRemarks,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#3498DB'
          }, {
            offset: 1,
            color: 'rgba(52, 152, 219, 0.3)'
          }]
        },
        borderRadius: [3, 3, 0, 0]
      }
    }]
  };

  // Add gender chart option
  const genderOption = {
    title: {
      text: 'Gender Distribution',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Gender (${adminInfo.barangay})` : 'Gender',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 12 : 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.genderDistribution
    }]
  };

  // Add employment status chart option
  const employmentOption = {
    title: {
      text: 'Employment Status',
      left: 'center',
      top: 5,
      textStyle: {
        color: '#333',
        fontSize: windowWidth < 768 ? 12 : 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        fontSize: windowWidth < 768 ? 9 : 10
      }
    },
    series: [{
      name: adminInfo.barangay ? `Employment (${adminInfo.barangay})` : 'Employment',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: windowWidth < 768 ? 12 : 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: dashboardData.employmentStatus.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: [
            '#27AE60', // Employed - Green
            '#F1C40F', // Self-employed - Yellow
            '#E74C3C'  // Not employed - Red
          ][index % 3]
        }
      }))
    }]
  };

  // State for children age data of solo parents
  const [ageData, setAgeData] = useState({
    rawData: [],
    ageGroups: {
      '0-5': 0,
      '6-12': 0,
      '13-17': 0,
      '18-21': 0,
      '22+': 0
    }
  });

  // Removed Age (lowest to highest) chart as requested
  
  // Age distribution chart for children of solo parents has been removed as requested

  // State for children count data
  const [childrenCountData, setChildrenCountData] = useState({
    chartData: [],
    childrenCounts: {
      '1 child': 0,
      '2 children': 0,
      '3 children': 0,
      '4 children': 0,
      '5+ children': 0
    }
  });

  // Solo parent age distribution chart option
  const getSoloParentAgeChartOption = () => {
    const data = Object.entries(soloParentAgeData.ageGroups).map(([name, value]) => ({
      name,
      value
    }));
    
    return {
      title: {
        text: 'Solo Parent Age Distribution',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: Object.keys(soloParentAgeData.ageGroups)
      },
      series: [
        {
          name: 'Age Groups',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  };
  
  // Chart for Number of Children
  const getChildrenCountChartOptions = () => {
    const customColors = [
      '#FF69B4', // Hot Pink
      '#4169E1', // Royal Blue
      '#9370DB', // Medium Purple
      '#20B2AA', // Light Sea Green
      '#FFD700'  // Gold
    ];

    return {
      title: {
        text: 'Number of Children',
        left: 'center',
        textStyle: {
          fontSize: windowWidth < 768 ? 12 : 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} families ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: {
          fontSize: windowWidth < 768 ? 9 : 10
        }
      },
      series: [
        {
          name: adminInfo.barangay ? `Children Count (${adminInfo.barangay})` : 'Children Count',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: windowWidth < 768 ? 12 : 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: Object.entries(childrenCountData.childrenCounts).map(([name, value], index) => ({
            name,
            value,
            itemStyle: {
              color: customColors[index % customColors.length]
            }
          }))
        }
      ]
    };
  };

  // Update the date validation function
  const validateDates = (start, end) => {
    // Clear previous error
    setDateError("");

    // Get current year
    const currentYear = new Date().getFullYear();

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if either date's year is in the future
      if (startDate.getFullYear() > currentYear || endDate.getFullYear() > currentYear) {
        setDateError("Cannot select future years");
        return false;
      }

      // Check if end date is before start date
      if (endDate < startDate) {
        setDateError("End date cannot be earlier than start date");
        return false;
      }
    }
    return true;
  };

  // Update the date change handlers
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (validateDates(newStartDate, endDate)) {
      setStartDate(newStartDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (validateDates(startDate, newEndDate)) {
      setEndDate(newEndDate);
    }
  };

  // Update the generateExcelReport function
  const generateExcelReport = async () => {
    if (reportCount >= 5) {
      setReportLimitMessage('You have reached the maximum of 5 report generations.');
      return;
    }
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates for the report');
      return;
    }
    if (!validateDates(startDate, endDate)) {
      return;
    }
    try {
      // Remove fetching of accepted users and User List sheet
      // Prepare chart data for Excel
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const totalPopulation = dashboardData.population.reduce((sum, val) => sum + val, 0);
      const totalRemarks = dashboardData.monthlyRemarks.reduce((sum, val) => sum + val, 0);
      const genderTotal = dashboardData.genderDistribution.reduce((sum, g) => sum + g.value, 0);
      const employmentTotal = dashboardData.employmentStatus.reduce((sum, e) => sum + e.value, 0);
      const childrenTotal = Object.values(childrenCountData.childrenCounts).reduce((sum, val) => sum + val, 0);
      const soloParentAgeTotal = Object.values(soloParentAgeData.ageGroups).reduce((sum, val) => sum + val, 0);

      // --- Helper functions for styling (from SDashboard.jsx) ---
      const createMainReportTitles = () => [
        { A: 'SANTA MARIA MUNICIPALITY' },
        { A: 'Municipal Social Welfare and Development Office (MSWDO)' },
        { A: 'SOLO PARENT ANALYTICS REPORT' }
      ];
      const createSheetHeaderDetails = (title, subtitle = '') => [
        { A: `Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` },
        { A: `Barangay: ${adminInfo.barangay}` },
        { A: `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}` },
        { A: '' },
        { A: title },
        { A: subtitle }
      ];
      const addReportHeaderStyling = (ws) => {
        ws['!cols'] = [
          { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
          { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
        ];
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push(
          { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
        );
        for (let i = 0; i < 3; i++) {
          const cellRef = `A${i + 1}`;
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: (i === 2) ? 20 : 14, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "16C47F" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        }
        for (let i = 4; i < 10; i++) {
          ws['!merges'].push({ s: { r: i, c: 0 }, e: { r: i, c: 7 } });
          const cellRef = `A${i + 1}`;
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: (i === 8 || i === 9), sz: (i === 8 || i === 9) ? 16 : 12, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "F0F0F0" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        }
      };
      const addDataTableHeaderStyling = (ws, headerRowIndex, numColumns) => {
        for (let c = 0; c < numColumns; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex - 1, c: c });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { bold: true, sz: 12, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "D9EAD3" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          }
        }
      };
      const addAlternatingRowColors = (ws, startRowIndex, endRowIndex, numColumns) => {
        const color1 = "FFFFFF";
        const color2 = "F2F2F2";
        for (let r = startRowIndex - 1; r < endRowIndex; r++) {
          const rowColor = (r % 2 === 0) ? color1 : color2;
          for (let c = 0; c < numColumns; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
            if (ws[cellRef]) {
              ws[cellRef].s = ws[cellRef].s || {};
              ws[cellRef].s.fill = { fgColor: { rgb: rowColor } };
            } else {
              ws[cellRef] = { s: { fill: { fgColor: { rgb: rowColor } } } };
            }
          }
        }
      };

      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();

      // --- Sheet 1: Executive Summary ---
      const summaryData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('EXECUTIVE SUMMARY', 'Overview from Dashboard Charts'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'METRIC', B: 'VALUE', C: 'PERCENTAGE', D: 'NOTES' },
        { A: 'Total Population', B: totalPopulation, C: '100%', D: 'All registered solo parents' },
        { A: 'Total Remarks', B: totalRemarks, C: totalPopulation ? `${(totalRemarks / totalPopulation * 100).toFixed(1)}%` : '0%', D: 'All remarks for solo parents' },
        { A: '', B: '', C: '', D: '' },
        { A: 'GENDER DISTRIBUTION', B: '', C: '', D: '' },
        ...dashboardData.genderDistribution.map(g => ({
          A: g.name,
          B: g.value,
          C: genderTotal ? `${(g.value / genderTotal * 100).toFixed(1)}%` : '0%',
          D: ''
        })),
        { A: '', B: '', C: '', D: '' },
        { A: 'EMPLOYMENT STATUS', B: '', C: '', D: '' },
        ...dashboardData.employmentStatus.map(e => ({
          A: e.name,
          B: e.value,
          C: employmentTotal ? `${(e.value / employmentTotal * 100).toFixed(1)}%` : '0%',
          D: ''
        })),
        { A: '', B: '', C: '', D: '' },
        { A: 'NUMBER OF CHILDREN', B: '', C: '', D: '' },
        ...Object.entries(childrenCountData.childrenCounts).map(([label, value]) => ({
          A: label,
          B: value,
          C: childrenTotal ? `${(value / childrenTotal * 100).toFixed(1)}%` : '0%',
          D: ''
        })),
        { A: '', B: '', C: '', D: '' },
        { A: 'SOLO PARENT AGE DISTRIBUTION', B: '', C: '', D: '' },
        ...Object.entries(soloParentAgeData.ageGroups).map(([label, value]) => ({
          A: label,
          B: value,
          C: soloParentAgeTotal ? `${(value / soloParentAgeTotal * 100).toFixed(1)}%` : '0%'
        }))
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      addReportHeaderStyling(summarySheet);
      addDataTableHeaderStyling(summarySheet, 12, 4);
      addAlternatingRowColors(summarySheet, 13, 13 + dashboardData.genderDistribution.length + dashboardData.employmentStatus.length + Object.keys(childrenCountData.childrenCounts).length + Object.keys(soloParentAgeData.ageGroups).length + 8, 4);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Executive Summary");

      // --- Sheet 2: Monthly Population ---
      const monthlyPopulationSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('MONTHLY POPULATION ANALYSIS', 'Population Trends by Month (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'MONTH', B: 'POPULATION COUNT', C: 'CUMULATIVE TOTAL' },
        ...monthNames.map((month, index) => {
          const cumulative = dashboardData.population.slice(0, index + 1).reduce((sum, count) => sum + count, 0);
          return {
            A: month,
            B: dashboardData.population[index],
            C: cumulative
          };
        }),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'TOTAL', B: totalPopulation, C: '' }
      ];
      const monthlyPopulationSheet = XLSX.utils.json_to_sheet(monthlyPopulationSheetData);
      addReportHeaderStyling(monthlyPopulationSheet);
      addDataTableHeaderStyling(monthlyPopulationSheet, 12, 3);
      addAlternatingRowColors(monthlyPopulationSheet, 13, 13 + monthNames.length - 1, 3);
      XLSX.utils.book_append_sheet(wb, monthlyPopulationSheet, "Monthly Population");

      // --- Sheet 3: Monthly Remarks ---
      const monthlyRemarksSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('MONTHLY REMARKS ANALYSIS', 'Remarks Trends by Month (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'MONTH', B: 'REMARKS COUNT' },
        ...monthNames.map((month, index) => ({
          A: month,
          B: dashboardData.monthlyRemarks[index]
        })),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'TOTAL', B: totalRemarks }
      ];
      const monthlyRemarksSheet = XLSX.utils.json_to_sheet(monthlyRemarksSheetData);
      addReportHeaderStyling(monthlyRemarksSheet);
      addDataTableHeaderStyling(monthlyRemarksSheet, 12, 2);
      addAlternatingRowColors(monthlyRemarksSheet, 13, 13 + monthNames.length - 1, 2);
      XLSX.utils.book_append_sheet(wb, monthlyRemarksSheet, "Monthly Remarks");

      // --- Sheet 4: Gender Distribution ---
      const genderSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('GENDER DISTRIBUTION', 'Breakdown by Gender (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'GENDER', B: 'COUNT', C: 'PERCENTAGE' },
        ...dashboardData.genderDistribution.map(g => ({
          A: g.name,
          B: g.value,
          C: genderTotal ? `${(g.value / genderTotal * 100).toFixed(1)}%` : '0%'
        }))
      ];
      const genderSheet = XLSX.utils.json_to_sheet(genderSheetData);
      addReportHeaderStyling(genderSheet);
      addDataTableHeaderStyling(genderSheet, 12, 3);
      addAlternatingRowColors(genderSheet, 13, 13 + dashboardData.genderDistribution.length - 1, 3);
      XLSX.utils.book_append_sheet(wb, genderSheet, "Gender Distribution");

      // --- Sheet 5: Employment Status ---
      const employmentSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('EMPLOYMENT STATUS', 'Breakdown by Employment (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'STATUS', B: 'COUNT', C: 'PERCENTAGE' },
        ...dashboardData.employmentStatus.map(e => ({
          A: e.name,
          B: e.value,
          C: employmentTotal ? `${(e.value / employmentTotal * 100).toFixed(1)}%` : '0%'
        }))
      ];
      const employmentSheet = XLSX.utils.json_to_sheet(employmentSheetData);
      addReportHeaderStyling(employmentSheet);
      addDataTableHeaderStyling(employmentSheet, 12, 3);
      addAlternatingRowColors(employmentSheet, 13, 13 + dashboardData.employmentStatus.length - 1, 3);
      XLSX.utils.book_append_sheet(wb, employmentSheet, "Employment Status");

      // --- Sheet 6: Number of Children ---
      const childrenSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('NUMBER OF CHILDREN', 'Distribution from Chart Data'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'CHILDREN COUNT', B: 'FAMILIES', C: 'PERCENTAGE' },
        ...Object.entries(childrenCountData.childrenCounts).map(([label, value]) => ({
          A: label,
          B: value,
          C: childrenTotal ? `${(value / childrenTotal * 100).toFixed(1)}%` : '0%'
        }))
      ];
      const childrenSheet = XLSX.utils.json_to_sheet(childrenSheetData);
      addReportHeaderStyling(childrenSheet);
      addDataTableHeaderStyling(childrenSheet, 12, 3);
      addAlternatingRowColors(childrenSheet, 13, 13 + Object.keys(childrenCountData.childrenCounts).length - 1, 3);
      XLSX.utils.book_append_sheet(wb, childrenSheet, "Number of Children");

      // --- Sheet 7: Solo Parent Age Distribution ---
      const soloParentAgeSheetData = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('SOLO PARENT AGE DISTRIBUTION', 'Distribution from Chart Data'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'AGE GROUP', B: 'COUNT', C: 'PERCENTAGE' },
        ...Object.entries(soloParentAgeData.ageGroups).map(([label, value]) => ({
          A: label,
          B: value,
          C: soloParentAgeTotal ? `${(value / soloParentAgeTotal * 100).toFixed(1)}%` : '0%'
        }))
      ];
      const soloParentAgeSheet = XLSX.utils.json_to_sheet(soloParentAgeSheetData);
      addReportHeaderStyling(soloParentAgeSheet);
      addDataTableHeaderStyling(soloParentAgeSheet, 12, 3);
      addAlternatingRowColors(soloParentAgeSheet, 13, 13 + Object.keys(soloParentAgeData.ageGroups).length - 1, 3);
      XLSX.utils.book_append_sheet(wb, soloParentAgeSheet, "Solo Parent Age Distribution");

      // Save the workbook with professional filename
      const reportDate = new Date().toISOString().split('T')[0];
      const fileName = `MSWDO_Solo_Parent_Report_${adminInfo.barangay}_${startDate}_to_${endDate}_${reportDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccessMessage('Generated Success');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      // Increment report count
      const newCount = reportCount + 1;
      setReportCount(newCount);
      localStorage.setItem('admin_report_count', newCount);
      setReportLimitMessage('');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  // Add helper function for employment status
  const standardizeEmploymentStatus = (status) => {
    if (!status) return 'Not employed';
    
    status = status.toLowerCase().trim();
    
    if (status.includes('self') || status.includes('self-employed') || status.includes('business')) {
      return 'Self-employed';
    } else if (status.includes('employ') || status.includes('working')) {
      return 'Employed';
    } else {
      return 'Not employed';
    }
  };

  // Add helper function for standardizing gender
  const standardizeGender = (gender) => {
    if (!gender) return null;
    
    gender = gender.toLowerCase().trim();
    
    if (gender.includes('female')) {
      return 'Female';
    } else if (gender.includes('male') && !gender.includes('female')) {
      return 'Male';
    } else if (gender.includes('lgbtq') || gender.includes('lgbt') || gender.includes('+')) {
      return 'LGBTQ+';
    }
    
    return null;
  };

  // Add a function to get the max date allowed (last day of current year)
  const getMaxDateForInput = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-12-31`;
  };

  // Helper to get current Philippine time
  const getPHTimeString = (date) => {
    return date.toLocaleString('en-PH', { 
      timeZone: 'Asia/Manila',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleExport = async () => {
    // Date validation for all exports
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates for the report');
      return;
    }
    if (!validateDates(startDate, endDate)) {
      return;
    }
    // Helper functions for styling (copied from SDashboard)
    const createMainReportTitles = () => [
      { A: 'SANTA MARIA MUNICIPALITY' },
      { A: 'Municipal Social Welfare and Development Office (MSWDO)' },
      { A: 'SOLO PARENT ANALYTICS REPORT' }
    ];
    const createSheetHeaderDetails = (title, subtitle = '') => [
      { A: `Report Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` },
      { A: `Barangay: ${adminInfo.barangay}` },
      { A: `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}` },
      { A: '' },
      { A: title },
      { A: subtitle }
    ];
    const addReportHeaderStyling = (ws) => {
      ws['!cols'] = [
        { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
      ];
      ws['!merges'] = ws['!merges'] || [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
      );
      for (let i = 0; i < 3; i++) {
        const cellRef = `A${i + 1}`;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, sz: (i === 2) ? 20 : 14, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "16C47F" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
      for (let i = 4; i < 10; i++) {
        ws['!merges'].push({ s: { r: i, c: 0 }, e: { r: i, c: 7 } });
        const cellRef = `A${i + 1}`;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: (i === 8 || i === 9), sz: (i === 8 || i === 9) ? 16 : 12, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "F0F0F0" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
    };
    const addDataTableHeaderStyling = (ws, headerRowIndex, numColumns) => {
      for (let c = 0; c < numColumns; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex - 1, c: c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, sz: 12, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D9EAD3" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
      }
    };
    const addAlternatingRowColors = (ws, startRowIndex, endRowIndex, numColumns) => {
      const color1 = "FFFFFF";
      const color2 = "F2F2F2";
      for (let r = startRowIndex - 1; r < endRowIndex; r++) {
        const rowColor = (r % 2 === 0) ? color1 : color2;
        for (let c = 0; c < numColumns; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
          if (ws[cellRef]) {
            ws[cellRef].s = ws[cellRef].s || {};
            ws[cellRef].s.fill = { fgColor: { rgb: rowColor } };
          } else {
            ws[cellRef] = { s: { fill: { fgColor: { rgb: rowColor } } } };
          }
        }
      }
    };
    let wb = XLSX.utils.book_new();
    let ws, fileName = '';
    if (exportFilter === 'monthlyPopulation') {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('MONTHLY POPULATION ANALYSIS', 'Population Trends by Month'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'MONTH', B: 'POPULATION COUNT', C: 'CUMULATIVE TOTAL' },
        ...monthNames.map((month, index) => {
          const cumulative = dashboardData.population.slice(0, index + 1).reduce((sum, count) => sum + count, 0);
          return {
            A: month,
            B: dashboardData.population[index],
            C: cumulative
          };
        }),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'TOTAL', B: dashboardData.population.reduce((sum, count) => sum + count, 0), C: '' }
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 3);
      addAlternatingRowColors(ws, 13, 13 + monthNames.length - 1, 3);
      XLSX.utils.book_append_sheet(wb, ws, "Monthly Population");
      fileName = `MSWDO_Monthly_Population_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    } else if (exportFilter === 'genderDistribution') {
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('GENDER DISTRIBUTION', 'Breakdown by Gender (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'GENDER', B: 'COUNT' },
        ...dashboardData.genderDistribution.map(g => ({
          A: g.name,
          B: g.value
        }))
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 2);
      addAlternatingRowColors(ws, 13, 13 + dashboardData.genderDistribution.length - 1, 2);
      XLSX.utils.book_append_sheet(wb, ws, "Gender Distribution");
      fileName = `MSWDO_Gender_Distribution_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    } else if (exportFilter === 'employmentStatus') {
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('EMPLOYMENT STATUS', 'Breakdown by Employment (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'STATUS', B: 'COUNT' },
        ...dashboardData.employmentStatus.map(e => ({
          A: e.name,
          B: e.value
        }))
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 2);
      addAlternatingRowColors(ws, 13, 13 + dashboardData.employmentStatus.length - 1, 2);
      XLSX.utils.book_append_sheet(wb, ws, "Employment Status");
      fileName = `MSWDO_Employment_Status_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    } else if (exportFilter === 'monthlyRemarks') {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('MONTHLY REMARKS ANALYSIS', 'Remarks Trends by Month (Chart Data)'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'MONTH', B: 'REMARKS COUNT' },
        ...monthNames.map((month, index) => ({
          A: month,
          B: dashboardData.monthlyRemarks[index]
        })),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'TOTAL', B: dashboardData.monthlyRemarks.reduce((sum, count) => sum + count, 0) }
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 2);
      addAlternatingRowColors(ws, 13, 13 + monthNames.length - 1, 2);
      XLSX.utils.book_append_sheet(wb, ws, "Monthly Remarks");
      fileName = `MSWDO_Monthly_Remarks_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    } else if (exportFilter === 'childrenCount') {
      const total = Object.values(childrenCountData.childrenCounts).reduce((sum, val) => sum + val, 0);
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('NUMBER OF CHILDREN', 'Distribution from Chart Data'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'CHILDREN COUNT', B: 'FAMILIES', C: 'PERCENTAGE' },
        ...Object.entries(childrenCountData.childrenCounts).map(([label, value]) => ({
          A: label,
          B: value,
          C: total ? `${(value / total * 100).toFixed(1)}%` : '0%'
        }))
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 3);
      addAlternatingRowColors(ws, 13, 13 + Object.keys(childrenCountData.childrenCounts).length - 1, 3);
      XLSX.utils.book_append_sheet(wb, ws, "Number of Children");
      fileName = `MSWDO_Number_of_Children_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    } else if (exportFilter === 'soloParentAge') {
      const total = Object.values(soloParentAgeData.ageGroups).reduce((sum, val) => sum + val, 0);
      const data = [
        ...createMainReportTitles(),
        { A: '' },
        ...createSheetHeaderDetails('SOLO PARENT AGE DISTRIBUTION', 'Distribution from Chart Data'),
        { A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '' },
        { A: 'AGE GROUP', B: 'COUNT', C: 'PERCENTAGE' },
        ...Object.entries(soloParentAgeData.ageGroups).map(([label, value]) => ({
          A: label,
          B: value,
          C: total ? `${(value / total * 100).toFixed(1)}%` : '0%'
        }))
      ];
      ws = XLSX.utils.json_to_sheet(data);
      addReportHeaderStyling(ws);
      addDataTableHeaderStyling(ws, 12, 3);
      addAlternatingRowColors(ws, 13, 13 + Object.keys(soloParentAgeData.ageGroups).length - 1, 3);
      XLSX.utils.book_append_sheet(wb, ws, "Solo Parent Age Distribution");
      fileName = `MSWDO_Solo_Parent_Age_Distribution_Report_${adminInfo.barangay}_${startDate}_to_${endDate}.xlsx`;
    }
    XLSX.writeFile(wb, fileName);
    setSuccessMessage('Generated Success');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <div className="dashboard">
        <div className="dashboard-header">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#16C47F',
                fontSize: { xs: '2rem', sm: '2.5rem' },
                textAlign: { xs: 'center', sm: 'left' },
                width: '100%'
              }}
            >
              {dashboardTitle}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                fontWeight: 300,
                backgroundColor: '#f5f5f5',
                px: 2,
                py: 1,
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: { xs: 'center', sm: 'flex-end' },
                width: { xs: '100%', sm: 'auto' },
                mt: { xs: 1, sm: 0 }
              }}
            >
              <i className="fas fa-clock" style={{ color: '#16C47F' }}></i>
              {getPHTimeString(currentTime)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                id="start-date"
                label="Start Date"
                type="date"
                size="small"
                value={startDate}
                onChange={handleStartDateChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: getMaxDateForInput() }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                id="end-date"
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={handleEndDateChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: getMaxDateForInput() }}
                sx={{ minWidth: 150 }}
              />
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel id="export-filter-label">Export</InputLabel>
                <Select
                  labelId="export-filter-label"
                  id="export-filter"
                  value={exportFilter}
                  label="Export"
                  onChange={e => setExportFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="monthlyPopulation">Monthly Population</MenuItem>
                  <MenuItem value="genderDistribution">Gender Distribution</MenuItem>
                  <MenuItem value="employmentStatus">Employment Status</MenuItem>
                  <MenuItem value="monthlyRemarks">Monthly Remarks</MenuItem>
                  <MenuItem value="childrenCount">Number of Children</MenuItem>
                  <MenuItem value="soloParentAge">Solo Parent Age Distribution</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="success"
                startIcon={<i className="fas fa-download"></i>}
                onClick={handleExport}
                sx={{ height: 40, minWidth: 160, fontWeight: 'bold', fontSize: 16 }}
                disabled={reportCount >= 5}
              >
                Export Data
              </Button>
            </Box>
            {dateError && <Alert severity="error">{dateError}</Alert>}
            {reportLimitMessage && <Alert severity="warning">{reportLimitMessage}</Alert>}
          </Box>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <Box className="charts-grid" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2, mt: 3 }}>
                <Typography variant="h6" mb={1}>Population Growth</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[0] = e; }}
                  option={populationOption}
                  style={{ height: '400px', width: '100%' }}
                />
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2, mt: { xs: 0, sm: 3 } }}>
                <Typography variant="h6" mb={1}>Gender Distribution</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[1] = e; }}
                  option={genderOption}
                  style={{ height: '400px', width: '100%' }}
                />
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" mb={1}>Employment Status</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[2] = e; }}
                  option={employmentOption}
                  style={{ height: '300px', width: '100%' }}
                />
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" mb={1}>Monthly Remarks</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[3] = e; }}
                  option={remarksOption}
                  style={{ height: '300px', width: '100%' }}
                />
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" mb={1}>Number of Children</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[4] = e; }}
                  option={getChildrenCountChartOptions()}
                  style={{ height: '300px', width: '100%' }}
                />
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" mb={1}>Solo Parent Age Distribution</Typography>
                <ReactECharts
                  ref={(e) => { chartsRef.current[5] = e; }}
                  option={getSoloParentAgeChartOption()}
                  style={{ height: '300px', width: '100%' }}
                />
              </Paper>
            </Box>
          </Box>
        )}
        {showSuccessModal && (
          <div className="soloparent-modal-overlay">
            <div className="soloparent-success-modal">
              <div className="soloparent-success-content">
                <CheckCircleIcon style={{ fontSize: '4rem', color: '#10b981', animation: 'pulse 1.5s infinite' }} />
                <p style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>{successMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Box>
  );
};

export default Dashboard;
