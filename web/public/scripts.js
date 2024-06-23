// Initialize the map
const map = L.map('map').setView([37.5665, 126.9780], 11); // Example coordinates (Seoul)

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Example marker (you can update coordinates as needed)
L.marker([37.5665, 126.9780]).addTo(map)
  .bindPopup('Seoul')
  .openPopup();

// Dropdown toggle function
function toggleDropdown(id) {
    document.getElementById(id).classList.toggle("show");
}

// Function to update the dropdown for hives
function updateDropdownForHives(region) {
    const regionCoordinates = {
        incheon: [37.375, 126.633],
        andong: [36.544, 128.8007]
    };

    if (regionCoordinates[region]) {
        map.setView(regionCoordinates[region], 15);
        L.marker(regionCoordinates[region]).addTo(map)
          .bindPopup(region.charAt(0).toUpperCase() + region.slice(1))
          .openPopup();
    }

    // Hive 목록 업데이트
    let hives = [];
    if (region === 'incheon') {
        hives = [
            { name: 'Hive 1', url: '/incheon/hive1' },
            { name: 'Hive 2', url: '/incheon/hive2' },
            { name: 'Hive 3', url: '/incheon/hive3' },
            { name: 'Hive 4', url: '/incheon/hive4' },
            { name: 'Hive 5', url: '/incheon/hive5' },
            { name: 'Hive 6', url: '/incheon/hive6' }
        ];
    } else if (region === 'andong') {
        hives = [
            { name: 'Hive 1', url: '/andong/hive1' },
            { name: 'Hive 2', url: '/andong/hive2' },
            { name: 'Hive 3', url: '/andong/hive3' },
            { name: 'Hive 4', url: '/andong/hive4' },
            { name: 'Hive 5', url: '/andong/hive5' },
            { name: 'Hive 6', url: '/andong/hive6' },
            { name: 'Hive 7', url: '/andong/hive7' },
            { name: 'Hive 8', url: '/andong/hive8' },
            { name: 'Hive 9', url: '/andong/hive9' },
            { name: 'Hive 10', url: '/andong/hive10' },
            { name: 'Hive 11', url: '/andong/hive11' },
            { name: 'Hive 12', url: '/andong/hive12' }
        ];
    }

    // Clear previous dropdown
    let areaDropdown = document.getElementById('areaDropdown');
    areaDropdown.innerHTML = ''; // Clear existing content

    hives.forEach(hive => {
        let button = document.createElement('button');
        button.textContent = hive.name;
        button.onclick = () => {
            // Reset to region selection dropdown
            resetDropdown();
        };
        areaDropdown.appendChild(button);
    });

    // Show the updated dropdown
    areaDropdown.classList.add('show');
    document.getElementById('areaButton').innerText = 'Hive 선택';
}

function resetDropdown() {
    // Reset to region selection dropdown
    let areaDropdown = document.getElementById('areaDropdown');
    areaDropdown.innerHTML = `
        <button onclick="updateDropdownForHives('incheon')">인천대학교 온실</button>
        <button onclick="updateDropdownForHives('andong')">안동대학교 양봉사</button>
    `;
    document.getElementById('areaButton').innerText = '지역 선택';
    areaDropdown.classList.remove('show');
}

function updateGraphs(region) {
    // Implement graph updates based on the region
    console.log('Updating graphs for region:', region);
    // Add your graph rendering logic here
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('#areaButton')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
