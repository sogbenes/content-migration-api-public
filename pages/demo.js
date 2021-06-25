import { useState, useEffect } from "react";

export default function Demo() {
  const [response, setResponse] = useState(null);
  useEffect(() => {
    fetch("http://localhost:3000/api/demo")
      .then((res) => res.json())
      .then((data) => {
        setResponse(data);
      });
  }, []);

  return (
    <div>
      {response ? (
        <div dangerouslySetInnerHTML={{ __html: response.data.value }} className="demo"></div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
