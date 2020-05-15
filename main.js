
$.getJSON('assets/data/data.json', function(data){

    let options = {
        data : data,
        panelHeaders : [],
        searchBoxPlaceholder : "Search Product"
    }

    $('#myCustomDiv').customFilterPanel(options);

});

