
const dequeue = function() {
    const value = document.getElementById('service_id').value;
    fetch('/web/dequeue?service=' + value)
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            // Update page
            const customerName = result.service.item.name;
            const recommendation = result.recommendation.recommendation;
            document.getElementById('recommendation').innerHTML = recommendation;
            document.getElementById('cust_name').innerHTML = customerName;
        });
};

document.getElementById('call_btn').addEventListener('click', function(){
    dequeue();
});