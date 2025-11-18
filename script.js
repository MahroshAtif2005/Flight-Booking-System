const API_BASE = "http://localhost:3000";

// Helper functions (global) 
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    return null;
  }
}
function isGuestMode() {
  return localStorage.getItem("guestMode") === "true";
}
function isUserLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function getSelectedFlight() {
  try {
    return JSON.parse(localStorage.getItem("selectedFlight") || "{}");
  } catch (e) {
    return {};
  }
}
console.log('script.js loaded');
document.addEventListener("DOMContentLoaded", () => {
 
  //  LOGIN PAGE (login.html) 

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${API_BASE}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("isLoggedIn", "true");
          alert("Login successful!");
          window.location.href = "main.html";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Connection error. Please try again.");
      }
    });
  }

  // MAIN PAGE (main.html)

  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    // show user info if logged in
    const user = getCurrentUser();
    if (isUserLoggedIn() && user) {
      const alertElement = document.getElementById("mainAlert");
      if (alertElement) alertElement.classList.add("hidden");

      const welcomeMsg = document.getElementById("welcomeMsg");
      if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${user.name}!`;

      const userAvatar = document.getElementById("userAvatar");
      if (userAvatar)
        userAvatar.textContent = user.name.substring(0, 2).toUpperCase();
    }

    searchBtn.addEventListener("click", async () => {
      const from = document.getElementById("from").value;
      const to = document.getElementById("to").value;
      const departDate = document.getElementById("departDate").value;

      if (!from || !to) {
        alert("Please enter both cities");
        return;
      }

      try {
        const params = new URLSearchParams({
          from,
          to,
          date: departDate,
        });

        const response = await fetch(
          `${API_BASE}/api/flights?${params.toString()}`
        );

        if (!response.ok) {
          const txt = await response.text();
          console.error("Flight search failed:", response.status, txt);
          alert("Server error while searching flights.");
          return;
        }

        const data = await response.json();

        if (data.success && data.flights && data.flights.length > 0) {
          displayFlights(data.flights);
        } else {
          const resultsDiv = document.getElementById("flightResults");
          if (resultsDiv)
            resultsDiv.innerHTML = "<p>No flights found for this route.</p>";
        }
      } catch (error) {
        console.error("Error in JS fetch:", error);
        alert("Failed to search flights: " + error.message);
      }
    });
    

    function displayFlights(flights) {
      const resultsDiv = document.getElementById("flightResults");
      if (!resultsDiv) return;

      resultsDiv.innerHTML = "";

      flights.forEach((flight) => {
        const flightDiv = document.createElement("div");
        flightDiv.className = "flight";
        flightDiv.innerHTML = `
          <strong>${flight.airline} - ${flight.flight_number}</strong><br>
          ${flight.departure_city} → ${flight.arrival_city}<br>
          Departure: ${flight.departure_time} | Arrival: ${flight.arrival_time}<br>
          Price: £${flight.price}<br>
          <button onclick="selectFlight(${flight.id}, '${flight.flight_number}', '${flight.departure_city}', '${flight.arrival_city}', ${flight.price})">
            Select this flight
          </button>
        `;
        resultsDiv.appendChild(flightDiv);
      });
    }
  }

  // Make selectFlight global so onclick string can see it
  window.selectFlight = function (id, flightNumber, from, to, price) {
    const flightData = {
      id,
      flightNumber,
      route: `${from} → ${to}`,
      date: document.getElementById("departDate")
        ? document.getElementById("departDate").value
        : "",
      price,
    };

    localStorage.setItem("selectedFlight", JSON.stringify(flightData));
    window.location.href = "class.html";
  };

  // CLASS SELECTION (class.html)
 
   if (document.querySelector(".class-card")) {
    // how many passengers we assume (change this if you want 1)
    const PASSENGERS = 2;

    // get flight data saved from main.html
    const flightData = getSelectedFlight() || {};

    // ---- Fill the "Flight Details" card (left) ----
    const detailRoute = document.getElementById("detail-route");
    if (detailRoute) detailRoute.textContent = flightData.route || "—";

    const detailDate = document.getElementById("detail-date");
    if (detailDate) detailDate.textContent = flightData.date || "—";

    const detailPassengers = document.getElementById("detail-passengers");
    if (detailPassengers) detailPassengers.textContent = String(PASSENGERS);

    // ---- Fill the "Price Summary" card (right) ----
    const summaryRoute = document.getElementById("summary-route");
    if (summaryRoute) summaryRoute.textContent = flightData.route || "—";

    const summaryDate = document.getElementById("summary-date");
    if (summaryDate) summaryDate.textContent = flightData.date || "—";

    const summaryPassengers = document.getElementById("summary-passengers");
    if (summaryPassengers) summaryPassengers.textContent = String(PASSENGERS);

    // ---- State for class + meals ----
    let state = {
      class: localStorage.getItem("flightClass") || "",
      meal1: localStorage.getItem("meal1") || "",
      meal2: localStorage.getItem("meal2") || "",
    };

    function updateTotal() {
      const sidebarPrice = document.getElementById("sidebar-price");
      if (!sidebarPrice) return;

      const basePrice = parseFloat(flightData.price) || 0;
      if (!basePrice) {
        sidebarPrice.textContent = "[PRICE]";
        return;
      }

      let multiplier = 1;
      if (state.class === "Business") multiplier = 1.5;
      else if (state.class === "First Class") multiplier = 2;

      const total = basePrice * PASSENGERS * multiplier;
      sidebarPrice.textContent = `£${total.toFixed(2)}`;
    }

    function markClassSelected() {
      ["card-economy", "card-business", "card-first"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("selected");
      });

      if (state.class) {
        const mapping = {
          Economy: "card-economy",
          Business: "card-business",
          "First Class": "card-first",
        };
        const elId = mapping[state.class] || null;
        if (elId) {
          const el = document.getElementById(elId);
          if (el) el.classList.add("selected");
        }

        const sidebarClass = document.getElementById("sidebar-class");
        if (sidebarClass) sidebarClass.innerText = state.class;
      }
    }

    function markMealSelected(pass, meal) {
      const prefix = pass === 1 ? "p1" : "p2";
      document
        .querySelectorAll(
          `#${prefix}-veg, #${prefix}-non, #${prefix}-halal, #${prefix}-kosher`
        )
        .forEach((el) => el.classList.remove("selected"));

      if (meal) {
        const idMap = {
          Vegetarian: `${prefix}-veg`,
          "Non-Vegetarian": `${prefix}-non`,
          Halal: `${prefix}-halal`,
          Kosher: `${prefix}-kosher`,
        };
        const id = idMap[meal];
        if (id) {
          const el = document.getElementById(id);
          if (el) el.classList.add("selected");
        }
      }
    }

    // make these global for onclick=""
    window.selectClass = function (cls) {
      state.class = cls;
      markClassSelected();
      updateTotal(); // recalc total when class changes
    };

    window.selectMeal = function (pass, meal) {
      if (pass === 1) state.meal1 = meal;
      else state.meal2 = meal;
      markMealSelected(pass, meal);
    };

    window.saveAndContinue = function () {
      if (!state.class) {
        alert("Please select a class.");
        return;
      }
      if (!state.meal1 || !state.meal2) {
        alert("Please select meals for both passengers.");
        return;
      }

      localStorage.setItem("flightClass", state.class);
      localStorage.setItem("meal1", state.meal1);
      localStorage.setItem("meal2", state.meal2);

      window.location.href = "payment.html";
    };

    window.resetSelections = function () {
      state.class = "";
      state.meal1 = "";
      state.meal2 = "";
      localStorage.removeItem("flightClass");
      localStorage.removeItem("meal1");
      localStorage.removeItem("meal2");
      markClassSelected();
      markMealSelected(1, null);
      markMealSelected(2, null);

      const sidebarClass = document.getElementById("sidebar-class");
      if (sidebarClass) sidebarClass.innerText = "—";

      const sidebarPrice = document.getElementById("sidebar-price");
      if (sidebarPrice) sidebarPrice.textContent = "[PRICE]";
    };

    // init on page load
    (function initClassPage() {
      if (localStorage.getItem("flightClass"))
        state.class = localStorage.getItem("flightClass");
      if (localStorage.getItem("meal1"))
        state.meal1 = localStorage.getItem("meal1");
      if (localStorage.getItem("meal2"))
        state.meal2 = localStorage.getItem("meal2");

      markClassSelected();
      markMealSelected(1, state.meal1);
      markMealSelected(2, state.meal2);
      updateTotal();
    })();
  }


  // PAYMENT PAGE (payment.html) 

  const cardNameInput = document.getElementById("cardName");
  if (cardNameInput) {
    const flightData = getSelectedFlight();
    const flightClass = localStorage.getItem("flightClass") || "—";
    const meal1 = localStorage.getItem("meal1") || "—";
    const meal2 = localStorage.getItem("meal2") || "—";

    const showRoute = document.getElementById("showRoute");
    if (showRoute) showRoute.textContent = flightData.route || "—";

    const showDate = document.getElementById("showDate");
    if (showDate) showDate.textContent = flightData.date || "—";

    const showClass = document.getElementById("showClass");
    if (showClass) showClass.textContent = flightClass;

    const showMeal1 = document.getElementById("showMeal1");
    if (showMeal1) showMeal1.textContent = meal1;

    const showMeal2 = document.getElementById("showMeal2");
    if (showMeal2) showMeal2.textContent = meal2;

    let basePrice = parseFloat(flightData.price) || 0;
    let classMultiplier =
      flightClass === "Business"
        ? 1.5
        : flightClass === "First Class"
        ? 2
        : 1;
    let totalBase = basePrice * 2 * classMultiplier;
    let taxes = 50;
    let totalPrice = totalBase + taxes;

    const baseFare = document.getElementById("baseFare");
    if (baseFare) baseFare.textContent = `£${totalBase.toFixed(2)}`;

    const totalPriceEl = document.getElementById("totalPrice");
    if (totalPriceEl) totalPriceEl.textContent = `£${totalPrice.toFixed(2)}`;

 window.payNow = async function () {
  const cardName = document.getElementById("cardName").value;
  const cardNumber = document.getElementById("cardNumber").value;

  if (!cardName || !cardNumber) {
    alert("Please fill in all payment details");
    return;
  }

  //  BLOCK GUEST USERS HERE
 const user = getCurrentUser();
const guest = isGuestMode();  //  true if they pressed "Continue as Guest"

if (guest || !isUserLoggedIn() || !user) {
  alert(
    "Booking NOT confirmed.\n\nYou need to log in / sign up before completing your booking."
  );
  window.location.href = "login.html";
  return;  // stop here
}

  //  From here on we know the user is logged in
  const userId = user.id;

  const bookingData = {
    userId: userId,
    flightId: flightData.id,
    flightClass: flightClass,
    meal1: meal1,
    meal2: meal2,
    totalPrice: totalPrice.toFixed(2),
  };

  try {
    const response = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("bookingReference", data.bookingReference);
      localStorage.setItem("totalPrice", `£${totalPrice.toFixed(2)}`);
      window.location.href = "confirmation.html";
    } else {
      alert("Booking failed: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Connection error. Please try again.");
  }
};
  }


  //CONFIRMATION PAGE (confirmation.html) 
window.continueAsGuest = function () {
  // clear any previous login
  localStorage.removeItem("user");
  localStorage.setItem("isLoggedIn", "false");

  //  mark that this session is guest
  localStorage.setItem("guestMode", "true");

  window.location.href = "main.html";
};
 
  const bookingRefElement = document.getElementById("bookingRef");
  if (bookingRefElement) {
    function loadConfirmationInfo() {
      const flightData = getSelectedFlight();
      const bookingRef =
        localStorage.getItem("bookingReference") || "N/A";
      const flightClass = localStorage.getItem("flightClass") || "—";
      const meal1 = localStorage.getItem("meal1") || "—";
      const meal2 = localStorage.getItem("meal2") || "—";
      const totalPrice = localStorage.getItem("totalPrice") || "—";

      bookingRefElement.innerText = bookingRef;

      const flightNum = document.getElementById("flightNum");
      if (flightNum) flightNum.innerText = flightData.flightNumber || "—";

      const route = document.getElementById("route");
      if (route) route.innerText = flightData.route || "—";

      const date = document.getElementById("date");
      if (date) date.innerText = flightData.date || "—";

      const flightClassEl = document.getElementById("flightClass");
      if (flightClassEl) flightClassEl.innerText = flightClass;

      const meal1El = document.getElementById("meal1");
      if (meal1El) meal1El.innerText = meal1;

      const meal2El = document.getElementById("meal2");
      if (meal2El) meal2El.innerText = meal2;

      const totalPaidEl = document.getElementById("totalPaid");
      if (totalPaidEl) totalPaidEl.innerText = totalPrice;
    }

    window.printConfirmation = function () {
      window.print();
    };

    window.emailConfirmation = function () {
      const bookingRef = localStorage.getItem("bookingReference");
      alert(
        "Confirmation email has been sent to your registered email address.\n\nBooking Reference: " +
          bookingRef
      );
    };

    loadConfirmationInfo();
  }

  // BOOKINGS PAGE (bookings.html)

  const bClassEl = document.getElementById("bClass");
  if (bClassEl) {
    const flightData = getSelectedFlight();
    const bookingRef = localStorage.getItem("bookingReference") || "—";
    const totalPrice = localStorage.getItem("totalPrice") || "—";
    const flightClass = localStorage.getItem("flightClass") || "—";
    const meal1 = localStorage.getItem("meal1") || "—";
    const meal2 = localStorage.getItem("meal2") || "—";

    const bRefEl = document.getElementById("bRef");
    if (bRefEl) bRefEl.innerText = bookingRef;

    const bRouteEl = document.getElementById("bRoute");
    if (bRouteEl) bRouteEl.innerText = flightData.route || "—";

    const bDateEl = document.getElementById("bDate");
    if (bDateEl) bDateEl.innerText = flightData.date || "—";

    if (bClassEl) bClassEl.innerText = flightClass;

    const bMeal1 = document.getElementById("bMeal1");
    if (bMeal1) bMeal1.innerText = meal1;

    const bMeal2 = document.getElementById("bMeal2");
    if (bMeal2) bMeal2.innerText = meal2;

    const bTotalEl = document.getElementById("bTotal");
    if (bTotalEl) bTotalEl.innerText = totalPrice;

    window.modifyBooking = function () {
      window.location.href = "class.html";
    };

    window.cancelBooking = function () {
      if (!confirm("Are you sure you want to cancel this booking?")) return;

      const bookingCard = document.getElementById("bookingCard");
      if (bookingCard) {
        bookingCard.style.display = "none";
      }
      alert("Booking cancelled.");
    };
  }
});