(function () { // IIFE

    $(function () {
        let allCoinsCachedArray = new Array();
        let moreInfoCoinsCachedMap = new Map();
        let openMoreInfoCardsSet = new Set();
        let checkedCoinsSet = new Set();
        let chartIntervalId;

        let urlOfAllCoins = `https://api.coingecko.com/api/v3/coins`;
        $.get(urlOfAllCoins).then(function (coinsArray) {
            $("#screenLoader").hide();
            initCoinCachedArray(coinsArray);
            for (let coin of allCoinsCachedArray) {
                addCoinToUI(coin);
            }
        })
            .catch(function (error) {
                console.log(error);
                alert("Failed to get coins from server");
            });

        function initCoinCachedArray(coinsArray) {
            for (let coinFullOfData of coinsArray) {
                let coin = {
                    id: coinFullOfData.id,
                    symbol: coinFullOfData.symbol,
                    name: coinFullOfData.name,
                    img: coinFullOfData.image.small
                }
                allCoinsCachedArray.push(coin);
            }
        }

        function cleanPage() {
            //stopping the interval of live-reports
            clearInterval(chartIntervalId);
            $("#chartsDivContainer").html("");
            $("#aboutDivContainer").html("");
            $("#cardsContainer").html("");
            $(".collapse").collapse("hide");
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~ Cards ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        function addCoinToUI(coin) {
            let coinCard = `<div id="${coin.id}Card" class="coin-card">
                <p class="coin-title">${coin.symbol}</p>
                <div class="toggle-button-div">
                 <label class="switch">
                    <input id="${coin.id}Switch" type="checkbox" class="default switch-input">
                    <span class="slider"></span>
                 </label>
                </div>
                 <p class="coin-body">${coin.name}</p>
                 <img class="coin-img" src="${coin.img}" alt="">
                 <button id="${coin.id}Button" class="btn btn-dark more-info-button">Show more</button>  
            </div>`;
            $("#cardsContainer").append(coinCard);
        }

        function showCachedShowMoreInfo() {
            for (let coinId of openMoreInfoCardsSet) {
                let pricesObject = moreInfoCoinsCachedMap.get(coinId);
                if (pricesObject == undefined) {
                    getMoreInfoFromServer(coinId);
                }
                else {
                    addCoinMoreInfoToUI(coinId, pricesObject);
                }
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~Cards toggle button ~~~~~~~~~~~~~~~~~~~~~

        $("#cardsContainer").on("click", ".switch-input", function () {
            let currentSwitchCoinId = $(this).attr("id");
            let currentCoinId = currentSwitchCoinId.substring(0, currentSwitchCoinId.length - 6);
            if ($(this).is(":checked")) {
                if (checkedCoinsSet.size == 5) {
                     //open modal
                    openModalAndChooseSwitches(currentCoinId);
                }
                else {
                    checkedCoinsSet.add(currentCoinId);
                }
            }
            else {
                checkedCoinsSet.delete(currentCoinId);
            }
        });

        function showCachedCheckedCards() {
            for (let coinId of checkedCoinsSet) {
                turnOnCardSwitch(coinId);
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ More info ~~~~~~~~~~~~~~~~~~~~~~~~~~~

        $("#cardsContainer").on("click", ".more-info-button", function () {
            let showMoreButtonId = $(this).attr("id");
            let coinId = showMoreButtonId.substring(0, showMoreButtonId.length - 6);

            if (!openMoreInfoCardsSet.has(coinId)) {
                if (!moreInfoCoinsCachedMap.has(coinId)) {
                    getMoreInfoFromServer(coinId, showMoreButtonId);
                }
                else {//if the prices data of the coin is already stored in cache
                    //first disable button until the prices are shown
                    $(`#${showMoreButtonId}`).prop('disabled', true);
                    let pricesObject = moreInfoCoinsCachedMap.get(coinId);
                    addCoinMoreInfoToUI(coinId, pricesObject);
                    setTimeout(function () {
                        $(`#${showMoreButtonId}`).prop('disabled', false);
                    }, 400);
                }
                openMoreInfoCardsSet.add(coinId);
            }
            else {//if the more info is already open
                //first disable button until the prices are deleted
                $(`#${showMoreButtonId}`).prop('disabled', true);
                removeMoreInfoFromUI(coinId);
                openMoreInfoCardsSet.delete(coinId);
                $(this).text("Show more");
                setTimeout(function () {
                    $(`#${showMoreButtonId}`).prop('disabled', false);
                }, 400);
            }
        });

        function addCoinMoreInfoToCache(coinId, pricesObject) {
            moreInfoCoinsCachedMap.set(coinId, pricesObject);
            setTimeout(function () {
                moreInfoCoinsCachedMap.delete(coinId);
            }, 10000);
        }

        function addCoinMoreInfoToUI(coinId, pricesObject) {
            let moreInfoElement = `<div id="${coinId}MoreInfo" class="more-info">
                                        <p><strong>USD</strong>: ${pricesObject.usd} $</p>
                                        <p><strong>EUR</strong>: ${pricesObject.eur} €</p>
                                        <p><strong>ILS</strong>: ${pricesObject.ils} ₪</p>
                                    </div>`;
            let coinCardId = `#${coinId}Card`;
            $(coinCardId).append(moreInfoElement);

            let coinCardButtonId = `#${coinId}Button`;
            $(coinCardButtonId).text("Show less");

            let moreInfoId = `#${coinId}MoreInfo`;
            $(moreInfoId).hide();
            $(moreInfoId).slideToggle("slow");
        }

        function removeMoreInfoFromUI(coinId) {
            let moreInfoDivId = `#${coinId}MoreInfo`;
            $(moreInfoDivId).slideToggle("slow", function () {
                $(moreInfoDivId).remove();
            });
        }

        function getPricesFromCoinData(coin) {
            let pricesObject = {
                usd: coin.market_data.current_price.usd,
                eur: coin.market_data.current_price.eur,
                ils: coin.market_data.current_price.ils
            };
            return pricesObject;
        }

        function getMoreInfoFromServer(coinId, showMoreButtonId) {
            //first disable the button until the prices are shown on screen
            $(`#${showMoreButtonId}`).prop('disabled', true);
            let urlOfSpecificCoin = `https://api.coingecko.com/api/v3/coins/${coinId}`
            addMoreInfoLoader(coinId);

            $.get(urlOfSpecificCoin).then(function (coin) {
                let pricesObject = getPricesFromCoinData(coin);
                addCoinMoreInfoToCache(coinId, pricesObject);
                addCoinMoreInfoToUI(coinId, pricesObject);
                removeMoreInfoLoader(coinId);
                setTimeout(function () {
                    $(`#${showMoreButtonId}`).prop('disabled', false);
                }, 400);
            })
                .catch(function (error) {
                    console.log(error);
                    alert("Failed to get coin from server");
                });
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ Search ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        function searchCoin() {
            let searchInput = $("#searchInput").val();
            $("#searchInput").val("");
            let filteredCoinsArray = allCoinsCachedArray.filter(coin => coin.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
                coin.name.toLowerCase().includes(searchInput.toLowerCase()));

                if (searchInput == "") {
                showHomePage();
                showCachedCheckedCards();
                showCachedShowMoreInfo();
            }
            else if (filteredCoinsArray.length == 0) {
                alert("Sorry, didn't find this coin");
            }
            else {
                cleanPage();
                for (let coin of filteredCoinsArray) {
                    addCoinToUI(coin);
                }
                showCachedCheckedCards();
                showCachedShowMoreInfo();
            }
        }

        $("#searchButton").on("click", function () {
            searchCoin();
        });

        $("#searchInput").keyup(function (event) { // Calls search function on "Enter" click. 
            let keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                searchCoin();
            }
        });

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ Modal ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        function openModalAndChooseSwitches(lastCoinId) {
            let beforeModalCheckedCoinStateSet = new Set(checkedCoinsSet);
            turnOffCardSwitch(lastCoinId);
            for (let coinId of checkedCoinsSet) {
                let [currentCoin] = allCoinsCachedArray.filter(coin => coin.id == coinId);
                let coinIdAndSwitchElement = createCoinIdAndSwitchElement(coinId, currentCoin.name, currentCoin.img);
                $("#modalTable").append(coinIdAndSwitchElement);
                turnOnModalSwitch(coinId);
            }
            let [lastCoin] = allCoinsCachedArray.filter(coin => coin.id == lastCoinId);
            let lastCoinIdAndSwitch = createCoinIdAndSwitchElement(lastCoinId, lastCoin.name, lastCoin.img);
            $("#modalTable").append(lastCoinIdAndSwitch);
            onModalSwitchInputClicked();
            onModalSaveButtonClicked();
            onModalXButtonClicked();
            onModalOutsideClicked();
            onModalCancelButtonClicked(lastCoinId, beforeModalCheckedCoinStateSet);
            $("#switches-modal").modal("show");
        }

        function createCoinIdAndSwitchElement(coinId, coinName, coinImg) {
            let coinIdAndSwitch = ` <tr>
                                        <td>
                                        <img class="modal-coin-img" src="${coinImg}" alt="">
                                            ${coinName}
                                        </td>
                                        <td>
                                            <label class="switch ">
                                                <input id="${coinId}ModalSwitch" type="checkbox" class="default modal-switch-input">
                                                <span class="slider"></span>
                                            </label>      
                                        </td>
                                    </tr>`;
            return coinIdAndSwitch;
        }

        function onModalSwitchInputClicked() {
            $(".modal-switch-input").on("click", function () {
                let currentSwitchCoinId = $(this).attr("id");
                let currentCoinId = currentSwitchCoinId.substring(0, currentSwitchCoinId.length - 11);
                //if the switch is been turned on
                if ($(this).is(":checked")) {
                    //if the checked switches is off limit - uncheck the last clicked
                    if (checkedCoinsSet.size == 5) {
                        setTimeout(function () {
                            turnOffModalSwitch(currentCoinId);
                        }, 100);
                    }
                    else {
                        turnOnCardSwitch(currentCoinId);
                        checkedCoinsSet.add(currentCoinId);
                    }
                }
                else {
                    turnOffCardSwitch(currentCoinId);
                    checkedCoinsSet.delete(currentCoinId);
                }
            });
        }

        function onModalCancelButtonClicked(lastCoinId, beforeModalCheckedCoinStateSet) {
            //first remove the old attached click event and then create new one
            $("#modalCancelButton").off('click').on("click", function () {
                checkedCoinsSet = new Set(beforeModalCheckedCoinStateSet);
                turnOffCardSwitch(lastCoinId);
                for (let coinId of checkedCoinsSet) {
                    turnOnCardSwitch(coinId);
                }
                $("#switches-modal").modal("hide");
            });
        }

        function onModalSaveButtonClicked() {
            $("#modalSaveButton").on("click", function () {
                cleanModalTableFromDomAndExit();
            });
        }
        function onModalXButtonClicked() {
            $("#modalExitButton").on("click", function () {
                cleanModalTableFromDomAndExit();
            });
        }

        function onModalOutsideClicked() {
            $('.modal').on('hidden.bs.modal', function () {
                cleanModalTableFromDomAndExit();
            });
        }

        function turnOnModalSwitch(coinId) {
            let coinSwitchElement = `#${coinId}ModalSwitch`;
            $(coinSwitchElement).attr("checked", true);
        }

        function turnOffModalSwitch(coinId) {
            let coinSwitchElement = `#${coinId}ModalSwitch`;
            $(coinSwitchElement).prop("checked", false);
        }

        function turnOnCardSwitch(coinId) {
            let coinSwitchElement = `#${coinId}Switch`;
            $(coinSwitchElement).prop("checked", true);
        }

        function turnOffCardSwitch(coinId) {
            let coinSwitchElement = `#${coinId}Switch`;
            $(coinSwitchElement).prop("checked", false);
        }

        function cleanModalTableFromDomAndExit() {
            $("#modalTable").html("");
            $("#switches-modal").modal("hide");
        };

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ Home ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        $("#homeButton").on("click", function () {
            showHomePage();
            showCachedCheckedCards();
            showCachedShowMoreInfo();
        });

        function showHomePage() {
            cleanPage();
            for (let coin of allCoinsCachedArray) {
                addCoinToUI(coin);
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ About ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        $("#aboutButton").on("click", function () {
            cleanPage();
            let aboutElement = `<div id="aboutDiv" class="container d-flex flex-row flex-wrap justify-content-sm-center">
                                    <div>
                                        <img id="profileImg" src="images/profile-picture.png" alt="">
                                    </div>
                                    <div id="aboutTextDiv">
                                        <h1>Barak Zoref</h1>
                                        <p id="aboutDescription">I'm a Full Stack Web Development student. <br>
                                        I'm 29 year old. I was born in Bat-Yam and raised in Ganey-Tikva.<br>
                                        When I was young I played professional Table-Tennis.<br>
                                        I also play the piano since the age of 6.<br>
                                        I like playing covers for familiar songs.<br>
                                        I really like math and computer science riddles.</p>
                                    </div>
                                    </div> `;
            $("#aboutDivContainer").append(aboutElement);
        });

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ Loader ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        function addMoreInfoLoader(coinId) {
            let loaderElement = `<div id="${coinId}Loader" class="loader-wrapper">
            <span class="loader">
                <span class="loader-inner"> </span>
            </span>
            </div>`;
            let coinCardId = `#${coinId}Card`;
            $(coinCardId).append(loaderElement);
        }

        function removeMoreInfoLoader(coinId) {
            let loaderId = `#${coinId}Loader`;
            $(loaderId).remove();
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~ Live Reports ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        $("#liveReportsButton").on("click", function () {
            if (checkedCoinsSet.size == 0) {
                alert("Please choose 1-5 coins");
            }
            else {
                cleanPage();
                let chartsContainerElement = `<div id="chartContainer" style="height: 320px; width: 100%;"></div>`
                $("#chartsDivContainer").append(chartsContainerElement);
                showLiveReports();
            }

        });

        function showLiveReports() {
            let coinsChosenArray = new Array();
            for (let coinId of checkedCoinsSet) {
                let [currentCoin] = allCoinsCachedArray.filter(coin => coinId == coin.id);
                coinsChosenArray.push(currentCoin);
            }
            let incompleteCoinsPricesUrl = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
            for (let coin of coinsChosenArray) {
                incompleteCoinsPricesUrl = incompleteCoinsPricesUrl + coin.symbol.toUpperCase() + ",";
            }
            //removing the spare ','
            incompleteCoinsPricesUrl = incompleteCoinsPricesUrl.substring(0, incompleteCoinsPricesUrl.length - 1);
            let coinPricesUrl = incompleteCoinsPricesUrl + "&tsyms=USD";

            var dataPoints = [];
            for (let i = 0; i < 5; i++) {
                dataPoints[i] = [];
            }
            var options = {
                title: {
                    text: "Crypto Coin Price Value"
                },
                axisX: {
                    title: "Time"
                },
                axisY: {
                    title: "USD",
                    suffix: "$"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "top",
                    fontSize: 22,
                    fontColor: "dimGrey",
                    itemclick: toggleDataSeries
                },
                data: []
            };

            for (let i = 0; i < coinsChosenArray.length; i++) {
                options.data.push({
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.00$",
                    showInLegend: true,
                    name: coinsChosenArray[i].name,
                    dataPoints: dataPoints[i]
                });
            }

            var chart = $("#chartContainer").CanvasJSChart(options);

            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                }
                else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            var updateInterval = 2000;
            let yValue = [5];
            var time = new Date;

            function setChartValues(coinsObject) {
                for (let i = 0; i < coinsChosenArray.length; i++) {
                    let currentSymbol = coinsChosenArray[i].symbol.toUpperCase();
                    yValue[i] = coinsObject[currentSymbol].USD;
                }
            }

            $.get(coinPricesUrl).then(function (coinsObject) {
                setChartValues(coinsObject);
                chartIntervalId = setInterval(function () {
                    updateChart()
                }, updateInterval);
            })
                .catch(function (error) {
                    console.log(error);
                    alert("Failed to get coins prices for chart");
                });

            function updateChart() {
                $.get(coinPricesUrl).then(function (coinsObject) {
                    setChartValues(coinsObject);
                    time.setTime(time.getTime() + updateInterval);
                    // pushing the new values
                    for (let i = 0; i < 5; i++) {
                        dataPoints[i].push({
                            x: time.getTime(),
                            y: yValue[i]
                        });
                    }

                    $("#chartContainer").CanvasJSChart().render();
                })
                    .catch(function (error) {
                        console.log(error);
                        alert("Failed to get coins prices for chart");
                    });
            }
        }
    });

})();

