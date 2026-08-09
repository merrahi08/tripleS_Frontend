import { useEffect, useState } from "react";
import { getMentorPendingRequests, claimRequest } from "../api/requestApi";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = 1; // temporary

  async function loadRequests() {
    try {
      const data = await getMentorPendingRequests(userId);
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleClaim(requestId) {
    try {
      await claimRequest(requestId);

      await loadRequests();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return <p>Loading requests...</p>;
  }

  return (
    <div>
      <h1>Incubation Requests</h1>

      {requests.map((request) => (
        <div key={request.id}>
          <h2>Request #{request.id}</h2>

          <button onClick={() => handleClaim(request.id)}>Claim</button>
        </div>
      ))}
    </div>
  );
}
