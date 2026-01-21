describe('Happy path', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    it('shows home screen', async () => {
        // The app shows "Home" in the bottom tab navigation
        await expect(element(by.text('Home'))).toBeVisible();
    });
});
