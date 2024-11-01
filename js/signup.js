document.getElementById("signupForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("api/user.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(username)}&email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`,
    });

    const statusCode = response.status;
    const data = await response.json();

    if (statusCode !== 200) {
      if (data && data.error) {
        alert("Signup Failed: " + data.error);
      } else {
        alert("Signup Failed: Server Error");
      }
      console.error("Error:", response);
      return;
    } else {
      if (data && data.message && data.user && data.user.id) {
        localStorage.setItem("user_id", data.user.id);
        window.location.href = "dashboard.html";
      } else {
        alert("Signup failed: Server Error");
        return;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Signup Failed: Server Error");
    return;
  }
});
