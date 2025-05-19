import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Form,
  Nav,
  Tab,
  Container,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import { format, parse } from "date-fns";
import { FiEdit } from "react-icons/fi";

// Register necessary ChartJS elements
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const teams = [
  "Siebel",
  "Weavers",
  "Falcons",
  "BI",
  "CSA",
  "Digiata",
  "Client Comms",
  "Delivery Engineering",
  "Appian",
  "Complex-transactions",
  "Rainmakers",
  "Rangers",
  "Hybrid Operations",
  "Ops Platform Core",
  "Group Savings",
  "Platform Foundation",
  "BPM",
];

const severityLevels = [
  { label: "Low", color: "#28a745" },
  { label: "Moderate", color: "#ffc107" },
  { label: "High", color: "#dc3545" },
];

const dummyData = [
  {
    id: 1,
    date: "2025-01-15",
    team: "Siebel",
    rootCause: "System crash",
    affectedClients: 5000,
    cost: 150000,
    disruptionDuration: 45,
    resolution: "Patched server issue",
    severity: "Moderate",
    riCriteria: "Monetary Value of 100k (gain or loss)"
  },
  {
    id: 2,
    date: "2025-02-10",
    team: "Weavers",
    rootCause: "API failure",
    affectedClients: 1200,
    cost: 12000,
    disruptionDuration: 20,
    resolution: "Deployed fix and restarted service",
    severity: "Low",
    riCriteria: "Bulk data breach > or more data subjects"
  },
  {
    id: 3,
    date: "2025-03-20",
    team: "Falcons",
    rootCause: "Security breach",
    affectedClients: 10000,
    cost: 50000,
    disruptionDuration: 90,
    resolution: "Implemented security patches",
    severity: "High",
    riCriteria: "Business disruption > 15 minutes externally and 60 min internally"
  },
  {
    id: 4,
    date: "2025-04-05",
    team: "Digiata",
    rootCause: "Data corruption",
    affectedClients: 2500,
    cost: 80000,
    disruptionDuration: 30,
    resolution: "Restored backup and fixed scripts",
    severity: "Moderate",
    riCriteria: "Fraud incident"
  },
  {
    id: 5,
    date: "2025-04-20",
    team: "Client Comms",
    rootCause: "Misconfigured settings",
    affectedClients: 500,
    cost: 10000,
    disruptionDuration: 15,
    resolution: "Reconfigured system settings",
    severity: "Low",
    riCriteria: "Contractual breaches"
  },
  {
    id: 6,
    date: "2025-05-01",
    team: "Ops Platform Core",
    rootCause: "Unplanned outage",
    affectedClients: 8000,
    cost: 200000,
    disruptionDuration: 120,
    resolution: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem aut cum eum id quos est.",
    severity: "High",
    riCriteria: "Deemed by COO or the Executives"
  },
  {
    id: 7,
    date: "2025-05-10",
    team: "BPM",
    rootCause: "Data loss incident",
    affectedClients: 3000,
    cost: 75000,
    disruptionDuration: 60,
    resolution: "Restored missing data from backups",
    severity: "Moderate",
    riCriteria: "Potential reputational damage > 25 Retail clients (include IFA's or any institutional client)"
  }
];

const RiskIncidentTracker = () => {
  const [incidents, setIncidents] = useState(dummyData);
  const [totalCost, setTotalCost] = useState(0);
  const [teamCosts, setTeamCosts] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    date: "",
    team: "",
    rootCause: "",
    affectedClients: 0,
    cost: "",
    resolution: "",
    severity: "",
  });
  const [errors, setErrors] = useState({});
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [chartData, setChartData] = useState({
    labels: ["No Data"],
    datasets: [
      {
        label: "Number of Teams",
        data: [0],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
      },
    ],
  });
  const [barChartData, setBarChartData] = useState({
    labels: ["No Data"],
    datasets: [
      { label: "Incident Cost (R)", data: [0], backgroundColor: "#dc3545" },
    ],
  });

  const [summaryStats, setSummaryStats] = useState({
    totalIncidents: 0,
    totalCost: 0,
    avgCost: 0,
    mostCommonRootCause: "Unknown",
    teamWithHighestCost: "Unknown",
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Cumulative Incident Trends by Severity" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw} incidents`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Month" } },
      y: {
        title: { display: true, text: "Cumulative Number of Incidents" },
        beginAtZero: true,
        ticks: { stepSize: 1 }, // Ensures whole numbers on Y-axis
      },
    },
  };

  const validateForm = () => {
    let errors = {};
    if (!newIncident.date) errors.date = "Date is required.";
    if (!newIncident.team) errors.team = "Team selection is required.";
    if (!newIncident.rootCause) errors.rootCause = "Root cause is required.";
    if (!newIncident.affectedClients)
      errors.affectedClients = "Affected clients field is required.";
    if (!newIncident.cost || isNaN(newIncident.cost) || newIncident.cost <= 0)
      errors.cost = "Enter a valid cost.";
    if (!newIncident.severity) errors.severity = "Select a severity level.";
    if (!newIncident.resolution) errors.resolution = "Resolution is required.";

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const calculateSummaryStats = (incidentsData) => {
    if (incidentsData.length === 0) return;

    const totalIncidents = incidentsData.length;
    const totalCost = incidentsData.reduce(
      (sum, incident) => sum + incident.cost,
      0
    );
    const avgCost =
      totalIncidents > 0 ? (totalCost / totalIncidents).toFixed(2) : 0;

    const rootCauseCount = {};
    const teamCostMap = {};

    incidentsData.forEach((incident) => {
      rootCauseCount[incident.rootCause] =
        (rootCauseCount[incident.rootCause] || 0) + 1;
      teamCostMap[incident.team] =
        (teamCostMap[incident.team] || 0) + incident.cost;
    });

    const mostCommonRootCause = Object.keys(rootCauseCount).reduce(
      (a, b) => (rootCauseCount[a] > rootCauseCount[b] ? a : b),
      "Unknown"
    );

    const teamWithHighestCost = Object.keys(teamCostMap).reduce(
      (a, b) => (teamCostMap[a] > teamCostMap[b] ? a : b),
      "Unknown"
    );

    setSummaryStats({
      totalIncidents,
      totalCost,
      avgCost,
      mostCommonRootCause,
      teamWithHighestCost,
    });
  };
  const calculateDashboardAnalytics = (incidentsData) => {
    setTotalIncidents(incidentsData.length);

    let severityTeams = { Low: [], Moderate: [], High: [] }; // low 1 moderate could 2 high 3
    incidentsData.forEach((incident) => {
      if (
        incident.severity &&
        severityTeams.hasOwnProperty(incident.severity)
      ) {
        if (!severityTeams[incident.severity].includes(incident.team)) {
          severityTeams[incident.severity].push(incident.team);
        }
      }
    });

    let severityLabels = Object.keys(severityTeams);
    let severityData = severityLabels.map(
      (severity) => severityTeams[severity].length
    );
    let teamLabels = severityLabels.map(
      (severity) =>
        `${severity}: ${severityTeams[severity].join(", ") || "No Teams"}`
    );

    setChartData({
      labels: teamLabels.length > 0 ? teamLabels : ["No Data"],
      datasets: [
        {
          label: "Number of Teams",
          data: severityData.length > 0 ? severityData : [0],
          backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
        },
      ],
    });
  };

  const calculateAnalytics = (incidentsData) => {
    const total = incidentsData.reduce(
      (sum, incident) => sum + (incident.cost || 0),
      0
    );
    setTotalCost(total);

    const teamCostMap = {};
    incidentsData.forEach((incident) => {
      if (incident.team) {
        teamCostMap[incident.team] =
          (teamCostMap[incident.team] || 0) + (incident.cost || 0);
      }
    });
    setTeamCosts(teamCostMap);
  };

  const prepareBarChartData = (incidentsData) => {
    let monthlyCosts = {};

    incidentsData.forEach((incident) => {
      const parsedDate = parse(incident.date, "yyyy-MM-dd", new Date());
      const monthName = format(parsedDate, "MMMM yyyy"); // Example: "March 2025"

      monthlyCosts[monthName] = (monthlyCosts[monthName] || 0) + incident.cost;
    });

    const sortedMonths = Object.keys(monthlyCosts).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const costData = sortedMonths.map((month) => monthlyCosts[month]);

    setBarChartData({
      labels: sortedMonths.length > 0 ? sortedMonths : ["No Data"],
      datasets: [
        {
          label: "Incident Cost (R)",
          data: costData.length > 0 ? costData : [0],
          backgroundColor: "rgba(220, 53, 69, 0.3)", // Light transparent red
          borderColor: "#dc3545", // Solid red border
          borderWidth: 1, // Thin bars
          barThickness: 10, // Reduce bar width
          hoverBackgroundColor: "rgba(220, 53, 69, 0.6)", // Slightly darker on hover
        },
      ],
    });
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Incident Costs Over Time" },
    },
    scales: {
      x: {
        title: { display: true, text: "Month" },
        ticks: { autoSkip: false }, // Ensures all month names appear
      },
      y: {
        title: { display: true, text: "Cost (R)" },
        beginAtZero: true,
      },
    },
  };

  useEffect(() => {
    calculateAnalytics(incidents);
    calculateDashboardAnalytics(incidents);
    prepareBarChartData(incidents);
    calculateSummaryStats(incidents); // Call summary statistics function
  }, [incidents]);

  const handleAddOrUpdateIncident = () => {
    if (!validateForm()) return;

    if (newIncident.id) {
      // Update existing incident
      const updatedIncidents = incidents.map((incident) =>
        incident.id === newIncident.id
          ? { ...newIncident, cost: Number(newIncident.cost) || 0 }
          : incident
      );
      setIncidents(updatedIncidents);
    } else {
      // Add new incident
      setIncidents([
        ...incidents,
        {
          ...newIncident,
          id: incidents.length + 1,
          cost: Number(newIncident.cost) || 0,
        },
      ]);
    }

    setNewIncident({
      date: "",
      team: "",
      rootCause: "",
      affectedClients: "",
      cost: "",
      resolution: "",
      severity: "",
    });
    setErrors({});
    setShowForm(false);
  };

  const editIncident = (incident) => {
    setNewIncident(incident);
    setShowForm(true);
  };
  const deleteIncident = (id) => {
    const updatedIncidents = incidents.filter((incident) => incident.id !== id);
    setIncidents(updatedIncidents);
  };

  return (
    <Container className="mt-4">
      <Tab.Container defaultActiveKey="incidents">
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="incidents">Incidents</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content className="mt-3">
          <Tab.Pane eventKey="incidents">
            <Card className="p-3 shadow-sm mb-4">
              <h2>Incident List</h2>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Date</th>
                    <th style={{ whiteSpace: "nowrap" }}>Team</th>
                    <th style={{ whiteSpace: "nowrap" }}>Root Cause Category</th>
                    <th style={{ whiteSpace: "nowrap" }}>Affected Clients</th>
                    <th style={{ whiteSpace: "nowrap" }}>Monetary Impact (R)</th>
                    <th style={{ whiteSpace: "nowrap" }}>Disruption Duration</th>
                    <th style={{ whiteSpace: "nowrap" }}>RI Criteria</th>
                    <th style={{ whiteSpace: "nowrap" }}>Severity</th>
                    <th style={{ textAlign: "left", wordWrap: "break-word", whiteSpace: "normal" }}>Resolution</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{incident.date}</td>
                      <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {incident.team}
                      </td>
                      <td>{incident.rootCause}</td>
                      <td>{incident.affectedClients}</td>
                      <td>{incident.cost}</td>
                      <td>{incident.disruptionDuration}</td>
                      <td style={{ textAlign: "left", whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" }}>
                        {incident.riCriteria}
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            severityLevels.find(
                              (s) => s.label === incident.severity
                            )?.color || "#ccc",
                          color: "#000",
                        }}
                      >
                        {incident.severity}
                      </td>
                      <td style={{ textAlign: "left", wordWrap: "break-word", whiteSpace: "normal", overflowWrap: "break-word" }}>
                        {incident.resolution}
                      </td>
                      <td>
                        <Button
                          variant="info"
                          size="sm"
                          style={{ backgroundColor: "#0056b3", borderColor: "#004494", color: "white" }}
                          onClick={() => editIncident(incident)}
                        >
                          <FiEdit />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <div className="d-flex justify-content-end mb-3">
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Add New Incident
              </Button>
            </div>
            <Modal show={showForm} onHide={() => setShowForm(false)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {newIncident.id ? "Edit Incident" : "Add New Incident"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      className={`form-control ${
                        errors.date ? "is-invalid" : ""
                      }`}
                      type="date"
                      value={newIncident.date}
                      onChange={(e) =>
                        setNewIncident({ ...newIncident, date: e.target.value })
                      }
                    />
                    {errors.date && (
                      <div className="invalid-feedback">{errors.date}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Team</Form.Label>
                  <Form.Select
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      className={`${errors.team ? "is-invalid" : ""}`}
                      value={newIncident.team}
                      onChange={(e) =>
                        setNewIncident({ ...newIncident, team: e.target.value })
                      }
                    >
                      <option value="">Select Team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.team && (
                      <div className="invalid-feedback">{errors.team}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Root Cause</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className={`form-control ${
                        errors.rootCause ? "is-invalid" : ""
                      }`}
                      placeholder="Enter root cause"
                      value={newIncident.rootCause}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          rootCause: e.target.value,
                        })
                      }
                    />
                    {errors.rootCause && (
                      <div className="invalid-feedback">{errors.rootCause}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Affected Clients</Form.Label>
                    <Form.Control
                      className={`form-control ${
                        errors.affectedClients ? "is-invalid" : ""
                      }`}
                      type="text"
                      placeholder="Enter affected clients"
                      value={newIncident.affectedClients}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          affectedClients: e.target.value,
                        })
                      }
                    />
                    {errors.affectedClients && (
                      <div className="invalid-feedback">
                        {errors.affectedClients}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Monetary Impact (R)</Form.Label>
                    <Form.Control
                      className={`form-control ${
                        errors.cost ? "is-invalid" : ""
                      }`}
                      type="number"
                      placeholder="Enter monetary impact"
                      value={newIncident.cost}
                      onChange={(e) =>
                        setNewIncident({ ...newIncident, cost: e.target.value })
                      }
                    />
                    {errors.cost && (
                      <div className="invalid-feedback">{errors.cost}</div>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Disruption Duration (minutes)</Form.Label>
                    <Form.Control
                      className={`form-control ${
                        errors.disruptionDuration ? "is-invalid" : ""
                      }`}
                      type="number"
                      placeholder="Enter disruption duration"
                      value={newIncident.disruptionDuration}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          disruptionDuration: e.target.value,
                        })
                      }
                    />
                    {errors.disruptionDuration && (
                      <div className="invalid-feedback">
                        {errors.disruptionDuration}
                      </div>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>RI Criteria</Form.Label>
                  <Form.Select
                      style={{ whiteSpace: "nowrap"}}
                      className={`${errors.riCriteria ? "is-invalid" : ""}`}
                      value={newIncident.riCriteria || ""}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          riCriteria: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled >
                        Select RI Criteria
                      </option>
                      <option value="Monetary Value of 100k (gain or loss)">
                        Monetary Value of 100k (gain or loss)
                      </option>
                      <option value={"Bulk data breach > or more data subjects"}>
                        {"Bulk data breach > or more data subjects"}
                      </option>
                      <option value={"Business disruption > 15 minutes externally and 60 min internally"}>
                        {"Business disruption > 15 minutes externally and 60 min internally"}
                      </option>
                      <option value="Fraud incident">Fraud incident</option>
                      <option value="Contractual breaches">
                        Contractual breaches
                      </option>
                      <option value="Deemed by COO or the Executives">
                        Deemed by COO or the Executives
                      </option>
                      <option value={"Potential reputational damage > 25 Retail clients"}>
                        {"Potential reputational damage > 25 Retail clients (include IFA's or any institutional client)"}
                      </option>
                    </Form.Select>
                    {errors.riCriteria && (
                      <div className="invalid-feedback">
                        {errors.riCriteria}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Severity</Form.Label>
                  <Form.Select
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      className={`${errors.severity ? "is-invalid" : ""}`}
                      value={newIncident.severity || ""}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          severity: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Select Severity
                      </option>
                      {severityLevels.map((level) => (
                        <option key={level.label} value={level.label}>
                          {level.label}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.severity && (
                      <div className="invalid-feedback">{errors.severity}</div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Resolution</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className={`form-control ${
                        errors.resolution ? "is-invalid" : ""
                      }`}
                      placeholder="Enter resolution"
                      value={newIncident.resolution}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          resolution: e.target.value,
                        })
                      }
                    />
                    {errors.resolution && (
                      <div className="invalid-feedback">
                        {errors.resolution}
                      </div>
                    )}
                  </Form.Group>

                  <Button
                    variant="success"
                    onClick={() => {
                      handleAddOrUpdateIncident();
                    }}
                  >
                    {newIncident.id ? "Update Incident" : "Submit Incident"}
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>
          </Tab.Pane>
          <Tab.Pane eventKey="dashboard">
            <Card className="p-3 shadow-sm mb-4">
              <h2>Retail-IT Risk Incident</h2>
              <p>
                <strong>Total Incidents:</strong> {totalIncidents}
              </p>
              <p>
                <strong>Total Cost (R):</strong>{" "}
                {totalCost ? totalCost.toLocaleString() : "0"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "40%" }}>
                  <h4>Teams per Severity Level</h4>
                  <Doughnut
                    data={
                      chartData.labels?.length
                        ? chartData
                        : { labels: [], datasets: [{ data: [] }] }
                    }
                  />
                </div>
                <div style={{ width: "60%" }}>
                  <h4>Incident Costs Over Months</h4>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default RiskIncidentTracker;


// Claudia 
// limit to 300 words
// text input must not accept links 
// Audit log - to see who made a change when and where

// Root Cause category needs to be a selector
// Code qaulity 
// DB/ Hardware 
// Duplicate
// Application configuaration 
// Solution Design 
// Data Exceptioin 
// Deployment Error
// Impact analysis failure 
// 