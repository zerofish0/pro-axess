import pronotepy
import datetime
import copy


class Axess:
    def __init__(
        self,
        username,
        password,
        url="https://0280994d.index-education.net/pronote/eleve.html",
        verbose=True,
        average_method = "conventional"
    ):
        self.url = url
        self.verbose = verbose
        self.average_method = average_method
        self.client = self._connect(username, password)

        self.infos = dict()
        self.grades = dict()
        self.homeworks = dict()
        self.planner = dict()

        self.momentum = int()

        if self.client.logged_in:
            self._log(f"Logged in as {username}")

    def _connect(self, username, password):
        return pronotepy.Client(self.url, username, password)

    def _log(self, text):
        if self.verbose:
            print(f"[*] {text}")

    def getInformations(self):
        self._log("Fetching informations...")
        infos = {}
        infos["etab"] = self.client.info.establishment
        infos["name"] = self.client.info.name.split(" ")[1]
        infos["surname"] = self.client.info.name.split(" ")[0]
        # infos['picture'] = self.client.info.profile_picture
        infos["class"] = self.client.info.class_name

        self.infos = infos
        self._log("Fetched informations.")
        return self.infos

    def getGrades(self):
        self._log("Fetching grades...")
        data = dict()
        period = self.client.current_period
        grades = period.grades
        for grade in grades:
            subject = grade.subject.name
            if not subject in data.keys():
                data[subject] = {"average": 9999, "details": []}
            try : 
                data[subject]["details"].append(
                    [
                        float(str(grade.grade).replace(",", ".")) / int(grade.out_of) * 20,
                        float(grade.coefficient),
                    ]
                )
            except :
                print(f"Had a problem with grade {grade.grade} in subject {subject}")
        for subject in data.keys():
            data0 = data[subject]["details"]
            data[subject]["average"] = sum(n[0]*n[1] for n in data0) / sum(n[1] for n in data0)
        data["global_avg"] = sum(data[subject]["average"] for subject in data.keys()) / len(data.keys())
        self.grades = data
        print(data)
        self._log("Fetched grades.")
        return self.grades

    def getHomeworks(self, date_str):  # YYYY-MM-DD
        self._log("Fetching homeworks...")
        date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        hw = self.client.homework(date, date)
        data = dict()
        for homework in hw:
            subject = homework.subject.name
            if not subject in data.keys():
                data[subject] = []
            data[subject].append(str(homework.description))

        self.homeworks = data
        self._log("Fetched homeworks.")
        return self.homeworks

    def getPlanner(self, date_str):  # dd/mm/yyyy
        self._log("Fetching planner...")
        date = datetime.datetime.strptime(date_str, "%d/%m/%Y").date()
        data0 = self.client.lessons(date)
        data = list()
        for classe in data0:
            (
                data.append(f"{classe.subject.name.capitalize()}"),
            )  # , {classe.teacher_name} ??

        self.planner = data
        self._log("Fetched Planner.")
        return self.planner

    def getMomentum(self):
        allgrades = list()
        grades = copy.copy(self.grades)
        for subject in grades.keys():
            if subject == "global_avg":
                pass
            else:
                data = grades[subject]["details"]
                for grade in data:
                    allgrades.append([grade[0], grade[1]])
        x = sum(n[0]*n[1] for n in allgrades)
        self.momentum = round(1 + (x ** 0.8451),2)
        return self.momentum
