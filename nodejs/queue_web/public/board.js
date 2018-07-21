const fetchServices = function() {
    fetch('/web/services?services=A1,A2,A3,B1,B2,B3')
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            for (let k in result) {
                document.getElementById(`st_${k}`).innerHTML = result[k];
            }   
        });
};

fetchServices();

const exampleSocket = new WebSocket("ws://localhost:8080/ws/sync");
exampleSocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    document.getElementById('st_' + data.service).innerHTML = data.item;
};