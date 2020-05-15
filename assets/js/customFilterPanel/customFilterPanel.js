(function($){

    
    $.fn.customFilterPanel = function (options){

        /**
         *  Global olarak kullanılacak variable'lar tanımlanıyor
         */     
        const global_mainDivId = '#' + this.attr('id');     // main div'in id'si
        const global_data = options.data;                   // panellere eklenecek data
        const global_splittedData = createSplittedData();   // hiyerşik index'ine göre sınıflandırılmış veri
        const global_panelHeaders = options.hasOwnProperty('panelHeaders') ? options.panelHeaders : [];     // panellerin üzerine yazılacak header'lar
        var global_mode = 'treeview';   // 2 farklı çalışma mantığı var. 1) (treeview) tree view'dan tıklayarak seçmek 2) (search) arama yaparak tüm kırılımlarda görüntülemek

        /**
         * Panel width'i gelen veriye göre css'te dinamik olarak değiştiriliyor
         */
        let dynamicPanelWidth = parseInt(100 / (global_splittedData.length + 1));
        document.documentElement.style.setProperty('--panelWidth', dynamicPanelWidth + '%');

        drawSearchBar();            // arama çubuğu çizdiriliyor
        appendPanelContainer();     // tab'leri içeren container oluşturuluyor
        drawNewTab(global_data);    // root panel çiziliyor

        /* ---------------------------------------------------- */

        //#region global functions

        /**
         *  Searchbox change event.
         *  Arama kutusunda bir text yazıldığında seçerek tıklama özelliği kalkacak. Tüm datanın içerisinde
         *  arama yapılarak her kırılımda eşleşen option'lar gösterilecek, tüm paneller görünür olacak. Eğer text'in tümü silinirse ağaç şeklinde seçim ekranına
         *  geri dönülecek
         */
        var firstKeyPress = true;   // ilk kez search için tuşa basıldığında tüm paneller hiyerarşik kırılımına göre dolacak
        $('#filterPanelSearchBar').keyup(function(event){
            
            // search box search value
            var currentSearchStr = $(this).val();

            /**
             *  Eğer search bar boş ise hiyerarşik seçime geri dönülecek
             */
            if(currentSearchStr == ""){
                global_mode = 'treeview';
                firstKeyPress = true;
                $('#panelsContainer').empty();
                drawNewTab(global_data);    // root panel çiziliyor
            }
            /**
             *  Search bar dolu ise 2 durum var.
             *  1) Örneğin "Abc" textinden sonra "d" harfi girildi. Bu durumda panelde hazırda olan option'ların içinde gezerek "Abcd" içermeyen option'ları sildiğimizde
             *     performanstan kazanıyoruz (tüm hiyerarşik datayı tekrar dönmüyoruz).
             * 
             *  2) Örneğin "Abc" textinden sonra backspace tuşu ile "Ab" yazıldı. Bu durumda hiyerarşik veride gezerek içinde "Ab" olan objeleri option olarak alıyoruz
             */
            else{

                global_mode = 'search';

                // ilk kez search'e giriyorsa paneller oluşturuluyor
                if(firstKeyPress){
                    $('#panelsContainer').empty();
                    firstKeyPress = false;
                    global_splittedData.forEach(function(element){
                        drawNewTab(element.nodes, currentSearchStr);
                    })
                }

                $('#panelsContainer').empty(); 
                global_splittedData.forEach(function(element){
                    drawNewTab(element.nodes, currentSearchStr);
                })

                //#region backspace performans için bu kod açılacak

                // // // girilen karakter backspace ise
                // // if(event.keyCode == 8){
                // //     $('#panelsContainer').empty(); 
                // //     global_splittedData.forEach(function(element){
                // //         drawNewTab(element.nodes, currentSearchStr);
                // //     })
                // // }
                // // // backspace'ten farklı bir karakter girilmişse
                // // else{
                // //     $('#panelsContainer').find('.tabContentContainer').each(function(){
                // //         $(this).find('.tabOption').each(function(){
                // //             // option text'inde search değeri olmayanları siliyoruz
                // //             if(!$(this).text().toLocaleLowerCase().trim().includes(currentSearchStr.toLocaleLowerCase().trim())){
                // //                 $(this).remove();
                // //             }
                // //         })
                // //     })
                // // }

                //#endregion

            }

            /* // search'box'ta 
            disableTreeSelect(); */

        })

        /**
         *  Veriyi hiyerarşik olarak sınıflandıran ve veriyi { hierararchicalIndex : Number, nodes : Array of Objects } şeklinde saklayan fonksiyon.
         *  Tüm veride gezdikten sonra sınıflandırılmış veriyi döndürür.
         */
        function createSplittedData(){

            var data = options.data;    // hiyerarşik data
            var splittedData = [];      // kırılımlarına göre sınıflandırılmış data
    
            /**
             * Recursive olarak tüm veriyi gezerek kırılıma göre gruplandıran fonksiyon
             * @param {*} data : hiyerarşik veri içerisindeki şuanki kırılım (recursive için)
             */
            function traverseData(data){
    
                // children boş ise recursive'i kesiyoruz
                if(data.length > 0){
    
                    var currentHierarchicalIndex = data[0].hierarchicalIndex;   // veri içindeki şuanki kırılım (root 0, child 1, grandchild 2 index şeklinde)
                    var isIndexUsedBefore = false;       
                    splittedData.forEach(function(element){
                        if(element.hierarchicalIndex == currentHierarchicalIndex) isIndexUsedBefore = true;
                    })
    
                    /**
                     *  Bölünmüş array'de daha önce bu kırılıma ait obje oluşturulmuşsa o objeye ekliyoruz.
                     */
                    if(isIndexUsedBefore){
                        var splittedObj = splittedData.find(function(x){  return x.hierarchicalIndex == currentHierarchicalIndex });
                        data.forEach(function(element){
                            splittedObj.nodes.push(element);
                        })
                    }
                    /**
                     *  Bölünmüş array'de daha önce bu kırılıma ait obje oluşturulmamışsa önce splittedData'ya pushlamak için bir obje oluşturuyoruz.
                     */
                    else{
                        var dataToAppend = [];  // objeye node olarak eklenecek array (daha sonraki elemanlar if'e girerek bu array'e pushlanacak)
                        data.forEach(function(element){
                            dataToAppend.push(element);
                        })
                        splittedData.push({
                            hierarchicalIndex : currentHierarchicalIndex,
                            nodes : dataToAppend
                        })
                    }
    
                    // data'nın tüm elemanları için recursive olarak fonksiyonu tekrar çağırıyoruz
                    data.forEach(function(element){
                        traverseData(element.children);
                    })
                    
                }
    
            }
    
            traverseData(data);

            return splittedData;
        }

        /**
         *  Her event'te objeler tekrar çizildiği için yeni yaratılan objelere event'leri tekrar bind etmemiz gerekiyor
         */
        function refreshEventHandlerFunctions(){

            $('.tabOption').unbind('click');

            /**
             *  Tree view'da option'a tıklandığında o panel ekranda sabit duracak. Daha üst kırılımlara tıklandığında olduğunda panel kapanmayacak
             */
            if(global_mode == 'treeview'){
                $('.tabOption').click(function(){

                    $(this).parent().find('.tabOption').removeClass('active');  // aynı panelde highlight olmuş option'ların highlight'ı kaldırılıyor
                    $(this).toggleClass('active');      // seçilen option hightlight ediliyor
    
                    /**
                     *  Üzerine tıklanan edilen değerin child node'ları alınarak yeni oluşacak panel verisi hazırlanıyor.
                     *  Ardından panel çizme fonksiyonuna gönderiliyor.
                     */
                    let dataForNewPanel = findObjectByName(global_data, $(this).text().trim());
    
                    // alt kırılımda data var ise yeni panel çizilecek
                    if(dataForNewPanel.hasOwnProperty('children') && dataForNewPanel.children.length !== 0)    drawNewTab(dataForNewPanel);
                    
                })
            }

        }

        /**
         * Yeni bir panel çizdirmeye yarayan fonk.
         * @param {*} data : yeni çizilecek tab'ın option'larını içeren data
         * @param {*} filterStr : eğer search için çiziliyorsa filtrelenecek option'lar
         */
        function drawNewTab(data, filterStr = ""){
            
            /**
             * Öncelikle bir önce çizilen panelin indexini alıyoruz. Yeni index bir öncekinin bir fazlası olacak
             * Bir önceki index undefined ise bu ilk panel'i çizdiğimizi gösterir.
             * Bu yüzden undefined ise index'e 0 veriyoruz.
             */
            let newTabIndex;
            if(global_mode == 'treeview')  newTabIndex = data.hierarchicalIndex == undefined ? 0 : parseInt(data.hierarchicalIndex) + 1;
            else newTabIndex = data[0] == undefined ? 0 : (data[0].hierarchicalIndex == undefined ? 0 : parseInt(data[0].hierarchicalIndex))

            let newTabId = 'tab_' + newTabIndex;
            
            if(global_mode == 'treeview') clearThePanel(newTabIndex);     // açıkta olan panellerle ilgili hide/show işlemleri

            // tab div'i oluşturuluyor
            let tabDiv = $('<div>', {
                id : newTabId,
                panelIndex : newTabIndex,
                class : 'filterPanelTab list-group'
            });

            // panel başlık div'i oluşturuluyor
            let tabHeaderDiv = $('<div>', {
                panelIndex : newTabIndex,
                class : 'tabHeaderContainer',
            })

            // başlık basılıyor
            tabHeaderDiv.append($('<p>', {
                panelIndex : newTabIndex,
                class : 'tabHeaderText',
                text : findPanelHeaderByIndex(newTabIndex)
            }))
            
            tabDiv.append(tabHeaderDiv);

            // panel'i content kısmı için div (option'ların olduğu kısım)
            let tabContentDiv = $('<div>', {
                panelIndex : newTabIndex,
                class : 'tabContentContainer',
            })

            /**
             *  Tab içerisine option'lar basılıyor
             */
            let dataToTraverse = data.children == undefined ? data : data.children;
            dataToTraverse.forEach(element => {
                
                // treeview ise tüm option'ları basacak
                if(global_mode == 'treeview'){
                    tabContentDiv.append($('<li>', {
                        panelIndex : newTabIndex,
                        class : 'tabOption list-group-item list-group-item-action',
                        text : element.name
                    }))
                }
                // search ise filtreleme yaparak basacak, aynı zamanda search ile eşleşen kısım bold görünecek. Bu sebeple bu option'ın değerini optionVal attribute'una basıyoruz
                else{
                    if(element.name.toLocaleLowerCase().trim().includes(filterStr.toLocaleLowerCase().trim())){

                        let regexpForBold = new RegExp(filterStr.trim(), 'gi');
                        let optionHtmlStr = element.name.trim().replace(regexpForBold, function(str) {return str.bold()});

                        let optionElement = $('<li>', {
                            panelIndex : newTabIndex,
                            class : 'tabOption list-group-item list-group-item-action',
                            optionVal : element.name,
                            html : optionHtmlStr
                        })
                        
                        tabContentDiv.append(optionElement);
                    } 
                }
               
            });
            
            tabDiv.append(tabContentDiv);

            $('#panelsContainer').append(tabDiv)
            
            // paneller arasında bulunan dik çizgi ekleniyor
            $('#panelsContainer').append($('<div>', {
                panelIndex : newTabIndex,
                class : 'verticalSeperator'
            }))
            
            refreshEventHandlerFunctions();     // yeni oluşan option'lar için event'ler tekrar bind ediliyor
            bindSelectedOptionsToElement();     // seçim yapılan yeni option'lar main div'e bind ediliyor
        
        }

        /**
         * Hiyerarşik veri içerisinde 'name' property'sini kullanarak obje aramaya yarayan recursive fonk.
         * Bu bulunan objenin child'ları new oluşan panel'e append edilecek
         * @param {*} obj   : child'larında obje aranacak array
         * @param {*} name  : aranan 'name' property'si. Veride her option için unique bir isim olmak zorunda
         */
        function findObjectByName(obj, name) {
            
            for(let i = 0; i < obj.length; i++){
                if(obj[i].name === name) { return obj[i]; }
            }
            
            for(let i = 0; i < obj.length; i++){
                var foundName = findObjectByName(obj[i].children, name);
                if(foundName) { return foundName; }
            }

            return false;
        };
        
        /**
         *  Tüm panellerde seçili olan option'lar main div'e data olarak eklenmesi
         */
        function bindSelectedOptionsToElement(){
            
            let panelSelectedOptions = [];
            $(global_mainDivId).find('.filterPanelTab').each(function(){    // seçili option'lar alınıyor

                let panelId = $(this).attr('id');
                let selectedOption = $(this).find('.tabOption.active').length == 0 ? '' : $(this).find('.tabOption.active').text().trim();

                if(selectedOption !== ''){  // panelde seçili option varsa array'e pushluyoruz
                    panelSelectedOptions.push({
                        panelId : panelId,
                        selectedOption : selectedOption
                    })
                }
            })

            $(global_mainDivId).data('selectedOptions', /* JSON.stringify(panelSelectedOptions) */ panelSelectedOptions);
        }

        /**
         *  Yeni panel oluşturulmadan önce eski panellerin gereksiz olanlarını hide eden, aynı zamanda vertical seperator ile ilgili de
         *  temizleme işlemi yapan fonk
         */
        function clearThePanel(compareIndex){

            compareIndex = +compareIndex;         // karşılaştırma yapılacak panel/seperator index'i

            /**
             *  Option üzerine tıklandığında o option'ın bulunduğu panelin en fazka bir alt kırılımı görülebilir (daha alt kırılımlar görünemez).
             *  Bu sebeple tıklanan option'ın içinde olduğu panelin index'inden daha büyük index'li panel'ler siliniyor
             */
            $(global_mainDivId).find('.filterPanelTab').each(function(){
                let currentPanelIndex = parseInt($(this).attr('panelIndex'));   // loop içerisinde sıradaki eleman
                if(currentPanelIndex >= compareIndex) $(this).remove();
            });

            /**
             *  Panellerin arasındaki dik çizgi ile ilgili işlemler
             */
            $(global_mainDivId).find('.verticalSeperator').each(function(){
                let currentPanelIndex = parseInt($(this).attr('panelIndex'));   // loop içerisinde sıradaki eleman
                if(currentPanelIndex >= compareIndex) $(this).remove();
            });


        }

        /**
         *  Oluşturulacak tab'ların içine ekleneceği container'ın çizilmesi
         */
        function appendPanelContainer(){
            $(global_mainDivId).append($('<div>', {
                id : 'panelsContainer',
            }));
        }

        /**
         *  Verilen panel index'ine karşılık gelen panel başlığını döndürür
         */
        function findPanelHeaderByIndex(panelIndex){
            panelIndex = +panelIndex;
            let requiredText = "";

            for(let i=0; i<global_panelHeaders.length; i++){
                if(i == panelIndex){
                    requiredText = global_panelHeaders[i];
                    break;
                }
            }

            return requiredText;
        }

        /**
         *  Üst tarafta bulunan search bar'ı çizen fonk.
         */
        function drawSearchBar(){  

            let searchContainer = $('<div>', {
                id : 'searchContainer',
            });

            let inputGroup = $('<div>', {
                                class : 'input-group',
                            });

            // search ikonu
            inputGroup.append('<span class="input-group-addon searchIcon"><i class="fa fa-search"></i></span>');  

            // search box
            inputGroup.append($('<input>', {
                id : 'filterPanelSearchBar',
                class : 'searchBox form-control',
                placeholder : options.hasOwnProperty('searchBoxPlaceholder') ? options.searchBoxPlaceholder : ""
            }))
            
            searchContainer.append(inputGroup);
            $(global_mainDivId).append(searchContainer);
        }

        //#endregion
    }

}(jQuery))