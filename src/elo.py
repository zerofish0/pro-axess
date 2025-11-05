class MyElo:
    def __init__(self):
        self.elo = 2000

    def getCoeff(self):
        if self.elo <= 1500:
            return 40
        if self.elo <= 2000:
            return 30
        if self.elo <= 2500:
            return 20
        if self.elo <= 3000:
            return 10
        return 5

    def normalizeCoefficientToDifficulty(self, coefficient):
        return 266 * coefficient + 933

    def updateElo(self, note):
        # note = [note/20, coeff]
        r = note[0] / 20
        k = self.getCoeff() * note[1]
        p = 1 / (
            1
            + 10 ** ((self.normalizeCoefficientToDifficulty(note[1]) - self.elo) / 400)
        )
        self.elo += k * (r - p)
        self.elo = int(self.elo)
