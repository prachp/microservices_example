(function() {
    const fetchQueue = function(type) {
        fetch('/web/list?type=' + type)
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                const items = result.items;
                if (!items) {
                    return;
                }
                const lis = items.map(function(item) {
                    return `<li>${item.id}</li>`;
                });
                document.getElementById(`q_${type}`).innerHTML = lis.join('');
            });
    };

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
    
    fetchQueue('A');
    fetchQueue('B');
    fetchServices();

    const dequeue = function() {
        const value = document.getElementById('service_id').value;
        fetch('/web/dequeue?service=' + value)
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                fetchQueue(value[0]);
                //fetchServices();   
            });
    };

    const enqueue = function(type) {
        let data = {type : type};
        fetch('/web/enqueue', {
            method: "POST", 
            mode: "cors", // no-cors, cors, *same-origin
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            redirect: "follow",
            referrer: "no-referrer",
            body: JSON.stringify(data)}
        )
            .then(function(response) {
                return response.json();
            })
            .then(function(result) {
                fetchQueue(type);
            });
    };

    document.getElementById('q_a_btn').addEventListener('click', function(){
        enqueue('A');
    });

    document.getElementById('q_b_btn').addEventListener('click', function(){
        enqueue('B');
    });

    document.getElementById('call_btn').addEventListener('click', function(){
        dequeue();
    });

    const exampleSocket = new WebSocket("ws://localhost:8080/ws/sync");
    exampleSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        document.getElementById('st_' + data.service).innerHTML = data.item;
    };

})();
