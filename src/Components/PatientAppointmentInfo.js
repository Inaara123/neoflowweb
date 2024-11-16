// src/components/PatientAppointmentInfo.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './PatientAppointmentInfo.css'; // Import the CSS file
import { auth } from '../firebase';

const PatientAppointmentInfo = () => {
  const [patientsData, setPatientsData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const rowsPerPage = 50;
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [timeRange, setTimeRange] = useState('single_day');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase.from('doctors').select('doctor_id,name').eq('hospital_id',auth.currentUser.uid);
      if (error) {
        console.error('Error fetching doctors:', error);
      } else {
        setDoctors(data);
        console.log('doctors',data);
      }
    } catch (error) {
      console.error('Unexpected error fetching doctors:', error);
    }
  };
  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Make a call to the Supabase RPC function
      const { data, error } = await supabase.rpc('get_patient_appointment_info', {
        p_hospital_id: auth.currentUser.uid,
        p_doctor_id: selectedDoctor ? selectedDoctor.toString() : null,
        p_gender: null,
        p_min_age: null,
        p_max_age: null,
        p_appointment_type: null,
        p_search_text: searchText.trim() !== '' ? searchText : null, // Pass the search text
        p_time_range:timeRange,
        p_start_date:customStartDate||null,
        p_end_date:customEndDate||null
      });
     
      if (error) {
        console.error('Error fetching patient data:', error);
      } else {
        setPatientsData(data);
        console.log('data fetched',patientsData);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchPatientData();
  }, [searchText, selectedDoctor, timeRange, customStartDate, customEndDate]); // Re-fetch data when the search text changes
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = patientsData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(patientsData.length / rowsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="patient-info-container">
      <h1>Patient Appointment Information</h1>

      <input
        type="text"
        className="search-bar"
        placeholder="Search by name, address, or contact number..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

        <div className="filters-container">
        <select
          className="filter-select"
          value={selectedDoctor || ''}
          onChange={(e) => setSelectedDoctor(e.target.value || null)}
        >
          <option value="">All Doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.doctor_id} value={doctor.doctor_id}>
              {doctor.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="single_day">1 Day</option>
          <option value="1_week">1 Week</option>
          <option value="1_month">1 Month</option>
          <option value="6_months">6 Months</option>
          <option value="custom">Custom Range</option>
        </select>
        {timeRange === 'custom' && (
          <div className="date-range-container">
            <div className="date-label-container">
                <label className="date-label">Start Date</label>
            <input
              type="date"
              className="date-input"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            </div>
            <div className="date-label-container">
                <label className="date-label">End Date</label>
            <input
              type="date"
              className="date-input"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
            </div>
          </div>
        )}
        </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="patient-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Address</th>
                <th>Contact Number</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Appointment Time</th>
                <th>Appointment Type</th>

              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((patient, index) => (
                  <tr key={index}>
                    <td>{indexOfFirstRow + index + 1}</td>
                    <td>{patient.patient_name}</td>
                    <td>{patient.address}</td>
                    <td>{patient.contact_number}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.age}</td>
                    {console.log(patient.appointment_time)}
                    <td>{new Date(patient.appointment_time).toLocaleString("en-GB",dateOptions)}</td>
                    <td>{patient.appointment_type}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No data available</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientAppointmentInfo;