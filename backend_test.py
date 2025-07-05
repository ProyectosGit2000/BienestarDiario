import requests
import unittest
import json
import time
from datetime import datetime

class DailyWellnessAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://8175f143-29c4-47cc-bd68-4ef24845d1d0.preview.emergentagent.com"
        self.test_user = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        }
        self.token = None
        self.user_id = None

    def test_01_health_check(self):
        """Test the API health endpoint"""
        print("\n🔍 Testing API health...")
        response = requests.get(f"{self.base_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        print("✅ API health check passed")

    def test_02_register_user(self):
        """Test user registration"""
        print("\n🔍 Testing user registration...")
        # First try to delete the user if it exists (for test repeatability)
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"username": self.test_user["username"], "password": self.test_user["password"]}
            )
            if response.status_code == 200:
                print("  ℹ️ Test user already exists, will use existing account")
                self.token = response.json()["token"]
                self.user_id = response.json()["user"]["id"]
                return
        except:
            pass

        # Register new user
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=self.test_user
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("user_id", data)
        print("✅ User registration passed")

    def test_03_login_user(self):
        """Test user login"""
        print("\n🔍 Testing user login...")
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"username": self.test_user["username"], "password": self.test_user["password"]}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.token = data["token"]
        self.user_id = data["user"]["id"]
        print("✅ User login passed")

    def test_04_invalid_login(self):
        """Test invalid login attempt"""
        print("\n🔍 Testing invalid login...")
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"username": self.test_user["username"], "password": "wrongpassword"}
        )
        self.assertEqual(response.status_code, 401)
        print("✅ Invalid login test passed")

    def test_05_get_user_info(self):
        """Test getting user info with JWT token"""
        print("\n🔍 Testing get user info...")
        if not self.token:
            self.test_03_login_user()
            
        response = requests.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], self.test_user["username"])
        self.assertEqual(data["email"], self.test_user["email"])
        print("✅ Get user info passed")

    def test_06_save_mood(self):
        """Test saving mood entry"""
        print("\n🔍 Testing mood saving...")
        if not self.token:
            self.test_03_login_user()
            
        mood_data = {
            "mood": 4,
            "date": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{self.base_url}/api/mood/save",
            headers={"Authorization": f"Bearer {self.token}"},
            json=mood_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        print("✅ Mood saving passed")

    def test_07_get_mood_history(self):
        """Test getting mood history"""
        print("\n🔍 Testing mood history retrieval...")
        if not self.token:
            self.test_03_login_user()
            
        response = requests.get(
            f"{self.base_url}/api/mood/history",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        print("✅ Mood history retrieval passed")

    def test_08_start_challenge(self):
        """Test starting a challenge"""
        print("\n🔍 Testing challenge start...")
        if not self.token:
            self.test_03_login_user()
            
        challenge_data = {
            "challengeId": 1
        }
        
        response = requests.post(
            f"{self.base_url}/api/challenge/start",
            headers={"Authorization": f"Bearer {self.token}"},
            json=challenge_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        print("✅ Challenge start passed")

    def test_09_complete_challenge(self):
        """Test completing a challenge"""
        print("\n🔍 Testing challenge completion...")
        if not self.token:
            self.test_03_login_user()
            
        # First start a challenge if not already started
        self.test_08_start_challenge()
        
        challenge_data = {
            "challengeId": 1
        }
        
        response = requests.post(
            f"{self.base_url}/api/challenge/complete",
            headers={"Authorization": f"Bearer {self.token}"},
            json=challenge_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("points_earned", data)
        print("✅ Challenge completion passed")

    def test_10_get_progress(self):
        """Test getting user progress"""
        print("\n🔍 Testing progress retrieval...")
        if not self.token:
            self.test_03_login_user()
            
        response = requests.get(
            f"{self.base_url}/api/progress",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_points", data)
        self.assertIn("completed_challenges", data)
        print("✅ Progress retrieval passed")

    def test_11_get_stats(self):
        """Test getting user stats"""
        print("\n🔍 Testing stats retrieval...")
        if not self.token:
            self.test_03_login_user()
            
        response = requests.get(
            f"{self.base_url}/api/stats",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("mood_entries", data)
        self.assertIn("completed_challenges", data)
        self.assertIn("current_streak", data)
        print("✅ Stats retrieval passed")

if __name__ == "__main__":
    # Run tests in order
    test_suite = unittest.TestSuite()
    test_suite.addTest(DailyWellnessAPITest('test_01_health_check'))
    test_suite.addTest(DailyWellnessAPITest('test_02_register_user'))
    test_suite.addTest(DailyWellnessAPITest('test_03_login_user'))
    test_suite.addTest(DailyWellnessAPITest('test_04_invalid_login'))
    test_suite.addTest(DailyWellnessAPITest('test_05_get_user_info'))
    test_suite.addTest(DailyWellnessAPITest('test_06_save_mood'))
    test_suite.addTest(DailyWellnessAPITest('test_07_get_mood_history'))
    test_suite.addTest(DailyWellnessAPITest('test_08_start_challenge'))
    test_suite.addTest(DailyWellnessAPITest('test_09_complete_challenge'))
    test_suite.addTest(DailyWellnessAPITest('test_10_get_progress'))
    test_suite.addTest(DailyWellnessAPITest('test_11_get_stats'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)