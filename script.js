(function () {
    var power, n1, n2, i, beta, alphaSelect, alpha, manQuality = "precision";
    var z1, z2, actualI, actualN2, zv1, zv2, yv1, yv2, mt1, mt2, q, k;
    var yv, sigmaB, mt, zv, z, Mmin, mn, mnIndex, b, fs, fw, fd, ft, vm, c, d1, d1, d, cForDf, centerdis;
    const factorOfSafety = 1.3;
    var sm = 10;
    const T = 45;
    const mnValues = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];

    const materialSelection = {
        ilessThanEquak4: {
            sigmaB1: 400,
            sigmaC1: 1100,
            sigmaB2: 320,
            sigmaC2: 950
        },
        iGreaterThan4: {
            sigmaB1: 320,
            sigmaC1: 950,
            sigmaB2: 140,
            sigmaC2: 500
        }
    };

    const cValues = {
        full20: 11860,
        "full14.5": 11440,
        stub20: 12300,
    };

    const f0Values = {
        full20: 1,
        "full14.5": 1,
        stub20: 0.8,
    };

    const cForDfValues = {
        full20: 0.25,
        "full14.5": 0.25,
        stub20: 1.3,
    };

    const eValues = {
        precision: {
            4: 0.0125,
            5: 0.0125,
            6: 0.015,
            8: 0.019,
            10: 0.022,
        },
        commercial: {
            4: 0.05,
            5: 0.056,
            6: 0.064,
            8: 0.080,
            10: 0.090,
        },
        carefully: {
            4: 0.025,
            5: 0.025,
            6: 0.030,
            8: 0.038,
            10: 0.044,
        },
    };

    function calculateDesignPower(power) { return power * factorOfSafety; }

    function checkforN1N2AndI() {
        n1 = +document.getElementById("n1").value;
        n2 = +document.getElementById("n2").value;
        i = +document.getElementById("i").value;

        if (!n1) {
            n1 = n2 * i;
        } else if (!n2) {
            n2 = +(n1 / i);
        } else if (!i) {
            i = +(n1 / n2);
        }
    }

    function calculateZ1Z2(z1) {
        z2 = Math.round(i * z1);

        actualI = z2 / z1;
        actualN2 = n1 / actualI;

        if (n2 - 10 <= actualN2 && actualN2 <= n2 + 10) {
            return;
        } else {
            z1 = z1 + 2;
            calculateZ1Z2(z1);
        }
    }

    function checkForMmin(a) {
        Mmin = 1.15 * (Math.cos(betaRad) * Math.cbrt((mt / (yv * sigmaB * z * a))))
    }

    function calculateB() {
        b = sm * mn;
        console.log(sm, mn)
        if (b < ((Math.PI * mn) / Math.sin(betaRad))) {
            sm += 2;
            calculateB(sm);
        } else {
            return;
        }
    }

    function checkFsAndFdAndFw() {
        calculateB();

        fs = sigmaB * b * yv * mn;

        d1 = (mn * z1) / Math.cos(betaRad);
        d2 = (mn * z2) / Math.cos(betaRad);

        vm = (Math.PI * d1 * n1) / 1000;

        const es = eValues[manQuality];

        var mnToGete;
        if (mn <= 4) {
            mnToGete = 4;
        } else if (mn > 4 && mn <= 10) {
            mnToGete = mn;
        } else {
            mnToGete = 10;
        }
        c = cValues[alphaSelect] * es[mnToGete];
        ft = 2 * mt1 / (d1 * 10);  // calculated in kgf

        bInCm = b / 10;
        fd = ft + ((0.164 * vm * (c * bInCm * (Math.cos(betaRad) * Math.cos(betaRad)) + ft) * Math.cos(betaRad)) / ((0.164 * vm) + (1.485 * Math.sqrt((c * bInCm * Math.cos(betaRad) * Math.cos(betaRad)) + ft))));
        // fd is in kgf

        if (fs < (fd * 10)) {
            if (sm < 20) {
                sm += 2;
            } else {
                mnIndex++;
                mn = mnValues[mnIndex];
            }
            checkFsAndFdAndFw()
        } else {
            fw = (b * d1 * q * k) / (Math.cos(betaRad) * Math.cos(betaRad));

            if (fw < fd) {
                checkFsAndFdAndFw();
            } else {
                return;
            }
        }
    }

    function calculateDh1(factor, d1, sigmaB) {
        dh1 = factor * ds1;
        lh1 = 1.1 * ds1;

        na = 6;  // number of arms
        // section eliptical

        fb = (ft * 10) / na;
        mb = fb * ((d1 - dh1) / 2);
        Zxx = mb * sigmaB; // from material selction selection

        major = Math.cbrt((64 * Zxx) / Math.PI);
        minor = major / 2;
console.log(factor, dh1)
        // check for na*major <= pie*dh1   true= nothing   false increase dh1  dh1=1.8*ds1  dh1=2*ds1 
        if ((na * major) <= (Math.PI * dh1)) {
            console.log(`Hub Dia: ${dh1}, Hub Length: ${lh1}, Number of arms: ${na}, Major axis (a): ${major}, Minor axis (c): ${minor}`)
            return;
        } else {
            calculateDh1(factor + 0.2, d1, sigmaB);
        }
    }

    function gearConstruction(mt1, d1, df1, da1, sigmaB1, type) {
        ds1 = Math.cbrt((16 * mt1) / (Math.PI * T));
        //debugger
        
        ds1 = Math.ceil(ds1/5)*5;

        console.log("Shaft dia ", ds1);
        var outpString;
        if (d1 <= 200) {   // solid disk construction
            if ((df1 - ds1) > (ds1 / 2)) {
                outpString = `${type} is separately mounted on shaft.`
            } else {
                outpString = `${type} is integrated with shaft.`
            }
            console.log(outpString)
        } else if (d1 > 200 && d1 <= 500) {   // web construction
            dh1 = 2 * ds1;//hub dia
            lh1 = 1.6 * ds1;//hub length

            D1 = da1 - (10 * mn);//inner rim dia

            rt1 = (df1 - D1) / 2;  //rim thickness

            wt1 = 0.3 * b;   // web thickness

            holesInWeb = (D1 - dh1) / 2;

            if (holesInWeb <= 70) {
                outpString = "Web construction with No holes."
            } else if (holesInWeb > 70 && holesInWeb <= 100) {
                outpString = "Web construction with Providing 4 holes in web.";
            } else {
                outpString = "Web construction with Providing 6 holes.";
            }

            holeDia = (D1 - dh1) / 5;
            pcdOfHole = (D1 + dh1) / 2;
            console.log("hub dia=", dh1, "hub length=", lh1, "inner rim dia", D1, "rim thickess", rt1, "web thickness=", wt1);
            console.log(`${type} ${outpString}`, "hole dia=", holeDia, " PCD of hole=", pcdOfHole);
        } else {
            // arm construction    new var na, fb, mb, Zxx, major, minor
            outpString = "Arm construction"
            console.log(`---${outpString}---`)
            D1 = da1 - (10 * mn);//inner rim dia

            calculateDh1(1.6, D1, sigmaB1);



        }

    }

    document.getElementById("check-btn").addEventListener('mouseup', (e) => {
        power = document.getElementById("power").value;
        beta = document.getElementById("beta").value || 15;

        if (beta < 15) {
            beta = 15;
        }

        betaRad = +beta * (Math.PI / 180)
        alphaSelect = document.getElementById("alpha").value;

        switch (alphaSelect) {
            case 'full20':
                alpha = 20;
                break;
            case 'full14.5':
                alpha = 14.5;
                break;
            case 'stub20':
                alpha = 20;
                break;
            default:
                alpha = 20;
                break;
        }

        alphaRad = +alpha * (Math.PI / 180)
        //manQuality = document.getElementById("manufactuirng-quality").value;

        checkforN1N2AndI();
        const designPower = calculateDesignPower(power);



        var Zmin = Math.ceil(2 / (Math.sin(alphaRad) * Math.sin(alphaRad)));

        if (Zmin % 2 === 0) {
            z1 = Math.floor(Zmin + 1);
        } else {
            z1 = Math.floor(Zmin + 2);
        }

        calculateZ1Z2(z1);

        if (z2 % z1 === 0) {
            z2 += 1;
        }

        actualI = z2 / z1;

        zv1 = z1 / (Math.cos(betaRad) * Math.cos(betaRad) * Math.cos(betaRad))
        zv2 = z2 / (Math.cos(betaRad) * Math.cos(betaRad) * Math.cos(betaRad))

        switch (alphaSelect) {
            case 'full20':
                yv1 = Math.PI * (0.154 - (0.912 / zv1));
                yv2 = Math.PI * (0.154 - (0.912 / zv2));
                break;
            case 'full14.5':
                yv1 = Math.PI * (0.124 - (0.684 / zv1));
                yv2 = Math.PI * (0.124 - (0.684 / zv2));
                break;
            case 'stub20':
                yv1 = Math.PI * (0.175 - (0.95 / zv1));
                yv2 = Math.PI * (0.175 - (0.95 / zv2));
                break;
            default:
                alpha = 20;
                break;
        }

        var selectedMaterial;
        if (actualI <= 4) {
            selectedMaterial = materialSelection.ilessThanEquak4;
        } else {
            selectedMaterial = materialSelection.iGreaterThan4;
        }

        const sigmaB1Yv1 = selectedMaterial.sigmaB1 * yv1;
        const sigmaB2Yv2 = selectedMaterial.sigmaB2 * yv2;

        mt1 = (9.55 * 1000000 * designPower) / n1;
        mt2 = (9.55 * 1000000 * designPower) / n2;

        if (sigmaB1Yv1 < sigmaB2Yv2) {
            yv = yv1;
            sigmaB = selectedMaterial.sigmaB1;
            mt = mt1;
            zv = zv1;
            z = z1;
        } else {
            yv = yv2;
            sigmaB = selectedMaterial.sigmaB2;
            mt = mt2;
            zv = zv2;
            z = z2;
        }

        checkForMmin(sm);

        mnIndex = mnValues.findIndex(entry => Mmin < entry);
        mn = mnValues[mnIndex];

        q = (2 * actualI) / (actualI + 1);
        k = (selectedMaterial.sigmaC1 * selectedMaterial.sigmaC1 * Math.sin(alphaRad) * 2) / (1.4 * 2.1 * 100000);
        checkFsAndFdAndFw();


        console.log(fs, fd * 10, fw, sm, mn)

        da1 = ((z1 / Math.cos(betaRad)) + (2 * f0Values[alphaSelect])) * mn;
        da2 = ((z2 / Math.cos(betaRad)) + (2 * f0Values[alphaSelect])) * mn;

        const cForDfMn = cForDfValues[alphaSelect] * mn;

        df1 = (((z1 / Math.cos(betaRad)) - (2 * f0Values[alphaSelect])) * mn) - (2 * cForDfMn);
        df2 = (((z2 / Math.cos(betaRad)) - (2 * f0Values[alphaSelect])) * mn) - (2 * cForDfMn);

        centerdis = (mn / Math.cos(betaRad)) / ((z1 + z2) / 2);

        console.log("Alpha ", alpha);
        console.log("No. of teeth on pinion=", z1, " no. of teeth on gear=", z2);
        console.log("norml module=", mn);
        console.log("Face width=", b);
        console.log("PCD of pinion d1=", d1, " PCD of gear d2=", d2);
        console.log("Tip dia of pinion da1=", da1, " Tip dia of gear da2=", da2);
        console.log("Root dia of pinion df2=", df2, " Root dia of gear df2=", df2);
        console.log("Center distance a=", centerdis);

        gearConstruction(mt1, d1, df1, da1, sigmaB = selectedMaterial.sigmaB1, 'Pinion');
        gearConstruction(mt2, d2, df2, da2, sigmaB = selectedMaterial.sigmaB2, 'Gear');


    });
})();