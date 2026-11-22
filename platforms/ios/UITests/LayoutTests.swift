import XCTest

final class LayoutTests: XCTestCase {
    func testLargeTextAndPersistentLongNames() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        XCTAssertFalse(app.buttons["Demo laden"].exists)
        app.tabBars.buttons["Finanzen"].tap()
        app.buttons["add-record"].tap()
        let name = app.textFields["record-name"].exists ? app.textFields["record-name"] : app.textViews["record-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        name.tap()
        let title = "Mein persönliches Konto für langfristige Lebensplanung"
        name.typeText(title)
        let amount = app.textFields["record-amount"]
        amount.tap(); amount.typeText("1234,56")
        app.buttons["save-record"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1) // Wait for the native navigation transition before visual capture.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "LargeText-Portrait"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.tabBars.buttons["Aktien"].isHittable)
        app.tabBars.buttons["Aktien"].tap()
        XCTAssertTrue(app.navigationBars["Aktien"].exists)
        let landscapeFrame = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width > app.frame.height }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [landscapeFrame], timeout: 5), .completed)
        Thread.sleep(forTimeInterval: 1)
        let landscape = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        landscape.name = "LargeText-Landscape"
        landscape.lifetime = .keepAlways
        add(landscape)
        XCUIDevice.shared.orientation = .portrait
        app.terminate()
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "0"
        app.launch()
        app.tabBars.buttons["Finanzen"].tap()
        XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
    }

    func testLongBudgetAndStockForms() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        app.tabBars.buttons["Pläne"].tap()
        app.buttons["Plan hinzufügen"].tap()
        let name = app.textFields["record-name"].exists ? app.textFields["record-name"] : app.textViews["record-name"]
        name.tap(); name.typeText("Wohnungseinrichtung und langfristige Lebensplanung")
        app.textFields["record-amount"].tap(); app.textFields["record-amount"].typeText("2500")
        app.buttons["save-record"].tap()
        let title = app.staticTexts["Wohnungseinrichtung und langfristige Lebensplanung"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        XCTAssertTrue(app.buttons["Position hinzufügen"].isHittable)
        Thread.sleep(forTimeInterval: 1)
        let budget = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        budget.name = "LargeText-Budget"
        budget.lifetime = .keepAlways
        add(budget)
        app.tabBars.buttons["Aktien"].tap()
        app.buttons["Aktie hinzufügen"].tap()
        let stockName = app.textFields["record-name"].exists ? app.textFields["record-name"] : app.textViews["record-name"]
        stockName.tap(); stockName.typeText("Persönliche langfristige Aktienbeobachtung")
        let symbol = app.textFields["Symbol"]
        for _ in 0..<4 { if symbol.isHittable { break }; app.swipeUp() }
        symbol.tap(); symbol.typeText("LONGSTOCK")
        app.buttons["save-record"].tap()
        XCTAssertTrue(app.staticTexts["Persönliche langfristige Aktienbeobachtung"].waitForExistence(timeout: 5))
        Thread.sleep(forTimeInterval: 1)
        let stocks = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        stocks.name = "LargeText-Stocks"
        stocks.lifetime = .keepAlways
        add(stocks)
        app.staticTexts["Persönliche langfristige Aktienbeobachtung"].tap()
        let alarm = app.buttons["Kursalarm einrichten"]
        for _ in 0..<4 { if alarm.isHittable { break }; app.swipeUp() }
        alarm.tap()
        let target = app.textFields["alert-target"]
        for _ in 0..<4 { if target.isHittable { break }; app.swipeUp() }
        target.tap(); target.typeText("123,45")
        Thread.sleep(forTimeInterval: 1)
        let alertScreenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        alertScreenshot.name = "LargeText-AlertEditor"
        alertScreenshot.lifetime = .keepAlways
        add(alertScreenshot)
        app.buttons["Abbrechen"].tap()
        XCTAssertTrue(app.buttons["Kursalarm einrichten"].waitForExistence(timeout: 5))
        app.buttons["Kursalarm einrichten"].tap()
        let emptyTarget = app.textFields["alert-target"]
        for _ in 0..<4 { if emptyTarget.isHittable { break }; app.swipeUp() }
        XCTAssertEqual(emptyTarget.value as? String, "Zielkurs in EUR")
        emptyTarget.tap(); emptyTarget.typeText("123,45")
        app.buttons["Speichern"].tap()
        XCTAssertTrue(app.buttons["Kursalarm einrichten"].waitForExistence(timeout: 5))
        app.buttons["Kursalarm einrichten"].tap()
        let restoredTarget = app.textFields["alert-target"]
        for _ in 0..<4 { if restoredTarget.isHittable { break }; app.swipeUp() }
        XCTAssertEqual(restoredTarget.value as? String, "123.45")
        app.buttons["Abbrechen"].tap()
    }
    func testInstallmentFormWithLargeText() throws {
        let app = XCUIApplication()
        app.launchEnvironment["MOREMONEY_UI_TEST_STORE"] = "1"
        app.launchEnvironment["MOREMONEY_RESET_TEST_DATA"] = "1"
        app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        app.tabBars.buttons["Mehr"].tap()
        app.buttons["Ratenkäufe"].tap()
        app.buttons["Ratenkauf hinzufügen"].tap()
        func fill(_ id: String, _ value: String) {
            let field = app.textFields[id].exists ? app.textFields[id] : app.textViews[id]
            for _ in 0..<6 { if field.isHittable { break }; app.swipeUp() }
            XCTAssertTrue(field.isHittable); field.tap(); field.typeText(value)
        }
        fill("installment-name", "Meine langfristige Anschaffung auf Raten")
        fill("installment-total", "1000,01")
        fill("installment-rate", "300")
        app.buttons["Speichern"].tap()
        let title = app.staticTexts["Meine langfristige Anschaffung auf Raten · Restbetrag"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        for _ in 0..<6 { if app.buttons["Zahlung erfassen"].firstMatch.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(app.buttons["Zahlung erfassen"].firstMatch.isHittable)
        app.buttons["Zahlung erfassen"].firstMatch.tap()
        app.buttons["Buchen"].tap()
        XCTAssertTrue(app.staticTexts["Bitte ein vorhandenes Konto wählen."].waitForExistence(timeout: 5))
        app.buttons["Abbrechen"].tap()
        Thread.sleep(forTimeInterval: 1)
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "LargeText-Installments"
        attachment.lifetime = .keepAlways; add(attachment)
    }
}
