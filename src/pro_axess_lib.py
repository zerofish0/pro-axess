import pronotepy
import datetime

class Axess : 
	def __init__(self,username,password,url = "https://0280994d.index-education.net/pronote/eleve.html",verbose = True) :
		self.url = url
		self.verbose = verbose
		self.client = self._connect(username,password)

		self.infos = dict()
		self.grades = dict()
		self.homeworks = dict()
		self.planner = dict()

		if self.client.logged_in : 
			self._log(f"Logged in as {username}")

	def _connect(self,username,password) : 
		return pronotepy.Client(self.url,username,password)

	def _log(self,text) : 
		if self.verbose : print(f"[*] {text}")

	def getInformations(self) : 
		self._log("Fetching informations...")
		infos = {}
		infos['etab'] = self.client.info.establishment
		infos['name'] = self.client.info.name.split(" ")[1]
		infos['surname'] = self.client.info.name.split(" ")[0]
		#infos['picture'] = self.client.info.profile_picture
		infos['class'] = self.client.info.class_name

		self.infos = infos
		self._log("Fetched informations.")
		return self.infos

	def getGrades(self) : 
		self._log("Fetching grades...")
		data = dict()
		period = self.client.current_period
		grades = period.grades
		for grade in grades : 
			subject = grade.subject.name
			if not subject in data.keys() : 
				data[subject] = {"average" : 9999,"details" : []}
			data[grade.subject.name]["details"].append([float(grade.grade)/int(grade.out_of)*20,float(grade.coefficient)])
		avg_sum = 0
		avg_len = 0
		for subject in data.keys() : 
			_sum = 0
			_sum_coeff = 0
			for grade in  data[subject]["details"] : 
				_sum += grade[0]*grade[1]
				_sum_coeff += grade[1]
				avg_sum += round(_sum/_sum_coeff,2)
				avg_len += 1
			data[subject]["average"] = round(_sum/_sum_coeff,2)
		data["global_avg"] = round(avg_sum/avg_len,2)
		self.grades = data
		self._log("Fetched grades.")
		return self.grades

	def getHomeworks(self,date_str) : #YYYY-MM-DD
		self._log("Fetching homeworks...")
		date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
		hw = self.client.homework(date)
		data = dict()
		for homework in hw : 
			subject = homework.subject.name
			if not subject in data.keys() : 
				data[subject] = []
			data[subject].append(str(homework.description))

		self.homeworks = data
		self._log("Fetched homeworks.")
		return self.homeworks

	def getPlanner(self,date_str) : #dd/mm/yyyy
		self._log("Fetching planner...")
		date = datetime.datetime.strptime(date_str, "%d/%m/%Y").date()
		data0 = self.client.lessons(date)
		data = list()
		for classe in data0 : 
			data.append(f"{classe.subject.name.capitalize()}") ,#, {classe.teacher_name} ??


		self.planner = data
		self._log("Fetched Planner.")
		return self.planner

