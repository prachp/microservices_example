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
            alert('Your number is ' + result.id);
        });
};

document.getElementById('q_a_btn').addEventListener('click', function(){
    enqueue('A');
});

document.getElementById('q_b_btn').addEventListener('click', function(){
    enqueue('B');
});