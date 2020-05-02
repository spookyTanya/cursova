// const axios = require('axios').default;
// import axios from 'axios';

console.log(window.location)

if (document.getElementById('go_back') !== null) {
    document.getElementById('go_back').addEventListener('click', function () {
        window.history.back();
    });
}

if (document.getElementById('departmentSelect') !== null) {
    document.getElementById('departmentSelect').addEventListener('change', function () {
        axios.get(window.location.origin + '/main/createPage/getRooms/5').then(function (response) {
            let select = document.getElementById('rooms');
            console.log(response)
            response.data.rooms.forEach(function (element) {
                let newOption = document.createElement('option');
                newOption.textContent = element.name + ', ' + element.depName;
                newOption.value = element.id;

                select.appendChild(newOption);
            });
        });
    });
}