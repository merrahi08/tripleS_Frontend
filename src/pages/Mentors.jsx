import { useEffect, useState } from "react";
import { getAllMentors } from "../api/mentorApi";

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await getAllMentors();
        setMentors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMentors();
  }, []);

  if (loading) {
    return <p>Loading mentors...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Mentors</h1>

      {mentors.map((mentor) => (
        <div key={mentor.id}>
          <h2>{mentor.name}</h2>
          <p>{mentor.title}</p>
          <p>{mentor.expertise}</p>
        </div>
      ))}
    </div>
  );
}
