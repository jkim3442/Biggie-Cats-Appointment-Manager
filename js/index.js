document.getElementById("seedButton").addEventListener("click", async function (event) {
  try {
    const response = await fetch("api/database.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to reinitialize database");
    }

    const data = await response.json();
    alert("Re-initialized database!");
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);
  }
});
