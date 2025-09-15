import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, getDocs, updateDoc } from 'firebase/firestore';
import { createTheme, ThemeProvider, CssBaseline, Box, Container, TextField, Button, Typography, Paper, Grid, MenuItem, Alert, CircularProgress, Tabs, Tab, List, ListItem, ListItemText, IconButton, Card, CardContent, Divider, Chip, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, AppBar, Toolbar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';

// Use this variable for the App ID provided in the canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Use this variable for the Firebase configuration provided in the canvas environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBHtoWu3yJddv8KaZiNjMNTKHDM4Sa8ov8",
  authDomain: "quiz-app-c80b0.firebaseapp.com",
  projectId: "quiz-app-c80b0",
  storageBucket: "quiz-app-c80b0.firebasestorage.app",
  messagingSenderId: "195417701399",
  appId: "1:195417701399:web:89e2af2003a82854067052",
  measurementId: "G-P2DTQF4S37"
};

// Initialize Firebase with the provided configuration
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const VIEWS = {
  AUTH: 'auth',
  HOME: 'home',
  CREATE_QUIZ: 'create_quiz',
  USER_QUIZ: 'user_quiz',
  VIEW_QUIZZES: 'view_quizzes'
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6200ea',
    },
    secondary: {
      main: '#03dac6',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: '0 3px 5px 2px rgba(98, 0, 234, .3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      let email;
      if (enrollmentNumber.includes('@')) {
        email = enrollmentNumber;
      } else {
        email = `${enrollmentNumber}@${appId}.quiz.com`;
      }

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists() && enrollmentNumber.startsWith('admin')) {
          await setDoc(userDocRef, {
            enrollmentNumber: 'admin',
            fullName: 'Admin User',
            department: 'Admin',
            semester: 0,
            role: 'admin'
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          enrollmentNumber,
          fullName,
          department,
          semester: parseInt(semester, 10),
          role: enrollmentNumber.startsWith('admin') ? 'admin' : 'user'
        });
      }
      onLogin();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            {isLogin ? 'Login' : 'Register'}
          </Typography>
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enrollment Number (e.g., '12345' or 'admin@quiz.com')"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                required
              />
            </Grid>
            {!isLogin && !enrollmentNumber.includes('@') && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Department Name"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{`Semester ${i + 1}`}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Login' : 'Register')}
          </Button>
          <Button
            color="primary"
            onClick={() => setIsLogin(!isLogin)}
            sx={{ mt: 1 }}
          >
            {isLogin ? 'Need to register? Sign Up' : 'Already have an account? Login'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

const UserHome = ({ userId, onLogout, onNavigate }) => {
  const [hasAttemptedQuiz, setHasAttemptedQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkQuizAttempt = async () => {
      const q = query(
        collection(db, "quizResults"),
        where("userId", "==", userId),
        where("round", "==", 1)
      );
      const querySnapshot = await getDocs(q);
      setHasAttemptedQuiz(!querySnapshot.empty);
      setLoading(false);
    };

    checkQuizAttempt();
  }, [userId]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome!
          </Typography>
          <Typography variant="h6" gutterBottom>
            User Home
          </Typography>
          <Grid container spacing={2} sx={{ mt: 4, flexDirection: 'column' }}>
            <Grid item xs={12}>
              {loading ? (
                <CircularProgress />
              ) : hasAttemptedQuiz ? (
                <Alert severity="info">You have already attempted the Round 1 quiz.</Alert>
              ) : (
                <Button 
                  fullWidth 
                  variant="contained"
                  onClick={() => onNavigate({ view: VIEWS.USER_QUIZ, round: 1 })}
                >
                  Round 1 Quiz
                </Button>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={onLogout}
                sx={{ mt: 2 }}
              >
                Logout
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

const CreateQuiz = ({ onQuizCreated, round }) => {
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState('');
  const [semester, setSemester] = useState('');
  const [quizDuration, setQuizDuration] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const q = query(
        collection(db, 'quizzes'),
        where('quizName', '==', `Round ${round} Quiz`)
      );
      const querySnapshot = await getDocs(q);
      const quizzesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExistingQuizzes(quizzesData);
    };
    fetchQuizzes();
  }, [round]);

  const handleQuizSelect = (quizId) => {
    setSelectedQuizId(quizId);
    if (quizId) {
      const quizToEdit = existingQuizzes.find(q => q.id === quizId);
      if (quizToEdit) {
        setQuestions(quizToEdit.questions || []);
        setSemester(quizToEdit.semester);
        setQuizDuration(quizToEdit.duration || '');
      }
    } else {
      setQuestions([]);
      setSemester('');
      setQuizDuration('');
    }
  };

  const handleMcqOptionChange = (index, value) => {
    const newOptions = [...mcqOptions];
    newOptions[index] = value;
    setMcqOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (mcqQuestion && mcqCorrectAnswer && mcqOptions.every(opt => opt !== '')) {
      setQuestions([...questions, {
        type: 'mcq',
        question: mcqQuestion,
        options: mcqOptions,
        correctAnswer: mcqCorrectAnswer,
      }]);
      setMcqQuestion('');
      setMcqOptions(['', '', '', '']);
      setMcqCorrectAnswer('');
    } else {
      alert('Please fill out all fields for the question.');
    }
  };

  const handleDeleteQuestion = (indexToDelete) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };

  const handleSaveQuiz = async () => {
    if (questions.length === 0 || semester === '' || quizDuration === '') {
      alert('Please add at least one question, select a semester, and set a quiz duration.');
      return;
    }
    setLoading(true);
    try {
      const quizData = {
        quizName: `Round ${round} Quiz`,
        questions,
        semester: parseInt(semester, 10),
        duration: parseInt(quizDuration, 10),
        createdAt: serverTimestamp(),
      };
      
      if (selectedQuizId) {
        await updateDoc(doc(db, "quizzes", selectedQuizId), quizData);
        alert('Quiz updated successfully!');
      } else {
        await addDoc(collection(db, "quizzes"), quizData);
        alert('New quiz created successfully!');
      }
      onQuizCreated();
    } catch (e) {
      console.error("Error saving document: ", e);
      alert('Error saving quiz. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Create/Manage Round {round} Quiz</Typography>
        <TextField
          fullWidth
          select
          label="Select Quiz to Edit or Create a New One"
          value={selectedQuizId}
          onChange={(e) => handleQuizSelect(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">Create New Quiz</MenuItem>
          {existingQuizzes.map(quiz => (
            <MenuItem key={quiz.id} value={quiz.id}>
              {`Round ${round} Quiz - Semester ${quiz.semester}`}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          select
          label="Select Semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          sx={{ mb: 2 }}
          required
        >
          {Array.from({ length: 8 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>{`Semester ${i + 1}`}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Quiz Duration (in minutes)"
          type="number"
          value={quizDuration}
          onChange={(e) => setQuizDuration(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        <Box>
            <Typography variant="h6" gutterBottom>Add Multiple Choice Question</Typography>
            <TextField
              fullWidth
              label="MCQ Question"
              value={mcqQuestion}
              onChange={(e) => setMcqQuestion(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Options</Typography>
            <Grid container spacing={2}>
              {mcqOptions.map((option, index) => (
                <Grid item xs={12} key={index}>
                  <TextField
                    fullWidth
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleMcqOptionChange(index, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>
            <TextField
              fullWidth
              label="Correct Answer (exactly as one of the options)"
              value={mcqCorrectAnswer}
              onChange={(e) => setMcqCorrectAnswer(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        <Button variant="contained" color="primary" onClick={handleAddQuestion} sx={{ mt: 2 }}>
          Add Question to Quiz
        </Button>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>Added Questions ({questions.length})</Typography>
        <List>
          {questions.map((q, index) => (
            <ListItem key={index} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteQuestion(index)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText
                primary={`Question ${index + 1}: ${q.question}`}
                secondary={ `Correct Answer: ${q.correctAnswer}`}
              />
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          variant="contained"
          color="secondary"
          sx={{ mt: 2 }}
          onClick={handleSaveQuiz}
          disabled={loading || questions.length === 0 || semester === ''}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Save Quiz`}
        </Button>
      </Paper>
    </Container>
  );
};

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'quizzes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quizList = [];
      querySnapshot.forEach((doc) => {
        quizList.push({ id: doc.id, ...doc.data() });
      });
      setQuizzes(quizList.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Available Quizzes</Typography>
      <Grid container spacing={2}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} key={quiz.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{quiz.quizName}</Typography>
                <Chip label={`Semester: ${quiz.semester}`} color="secondary" size="small" sx={{ mt: 1, mr: 1 }} />
                <Chip label={`${quiz.questions.length} Questions`} color="primary" size="small" sx={{ mt: 1, mr: 1 }} />
                <Chip label={`${quiz.duration} mins`} color="info" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const UserQuiz = ({ onQuizCompleted, round, userSemester, enrollmentNumber }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  
  const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    const handleBlur = () => {
      setTabSwitchCount(prevCount => prevCount + 1);
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const checkAttemptAndFetchQuiz = async () => {
      setLoading(true);
      setError('');

      if (!auth.currentUser) {
          setError("You must be logged in to attempt a quiz.");
          setLoading(false);
          return;
      }

      // First, check if the user has already attempted this round
      const attemptQuery = query(
          collection(db, 'quizResults'),
          where('userId', '==', auth.currentUser.uid),
          where('round', '==', round)
      );
      const attemptSnapshot = await getDocs(attemptQuery);

      if (!attemptSnapshot.empty) {
          setError("You have already attempted this quiz.");
          setLoading(false);
          return;
      }

      try {
        const q = query(
          collection(db, 'quizzes'),
          where('quizName', '==', `Round ${round} Quiz`),
          where('semester', '==', userSemester)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const quizDoc = querySnapshot.docs[0];
          const quizData = { id: quizDoc.id, ...quizDoc.data() };
          
          const numQuestions = round === 1 ? 10 : 3;
          const shuffledQuestions = shuffleArray(quizData.questions);
          const selectedQuestions = shuffledQuestions.slice(0, numQuestions);
          
          const newQuizData = { ...quizData, questions: selectedQuestions };
          
          setQuiz(newQuizData);
          setTimeLeft(newQuizData.duration * 60);
        } else {
          setError(`It looks like a quiz for your semester hasn't been created yet. Please check back later!`);
        }
      } catch (e) {
        console.error("Error fetching quiz: ", e);
        setError("An unexpected error occurred while fetching the quiz. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkAttemptAndFetchQuiz();
  }, [round, userSemester]);

  const calculateScore = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    let newScore = 0;
    quiz.questions.forEach((q, index) => {
      if (q.type === 'mcq') {
        if (answers[index] === q.correctAnswer) {
          newScore += 1;
        }
      }
    });
    setScore(newScore);

    if (round === 1 && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let finalEnrollmentNumber = enrollmentNumber;
        let finalSemester = userSemester;

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            finalEnrollmentNumber = userData.enrollmentNumber || enrollmentNumber;
            finalSemester = userData.semester || userSemester;
        }
        
        await addDoc(collection(db, "quizResults"), {
            userId: auth.currentUser.uid,
            enrollmentNumber: finalEnrollmentNumber,
            semester: finalSemester,
            quizId: quiz.id,
            quizName: quiz.quizName,
            score: newScore,
            totalQuestions: quiz.questions.length,
            round: round,
            tabSwitches: tabSwitchCount,
            completedAt: serverTimestamp(),
        });

      } catch (e) {
        console.error("Error saving quiz result: ", e);
      }
    }

    setQuizFinished(true);
  };
  
  useEffect(() => {
    if (quiz && !quizFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !quizFinished && quiz) {
        calculateScore();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, quizFinished, timeLeft]);

  const handleAnswerChange = (event) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: event.target.value };
    setAnswers(newAnswers);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="warning">{error}</Alert>
          <Button variant="contained" sx={{ mt: 2 }} onClick={onQuizCompleted}>Go Back</Button>
        </Paper>
      </Container>
    );
  }

  if (quizFinished) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Quiz Finished!</Typography>
          <Typography variant="h5" sx={{ mb: 2 }}>Your Score: {score} / {quiz.questions.length}</Typography>
          <Button variant="contained" onClick={onQuizCompleted}>Go Back to Home</Button>
        </Paper>
      </Container>
    );
  }

  if (!quiz) {
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{quiz.quizName}</Typography>
          <Typography variant="h6" color="primary">Time Left: {formatTime(timeLeft)}</Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ minHeight: '300px' }}>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ mb: 2 }}>
              <Typography variant="body1">{currentQuestion.question}</Typography>
            </FormLabel>
            <RadioGroup
              value={answers[currentQuestionIndex] || ''}
              onChange={handleAnswerChange}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} startIcon={<ArrowBackIcon />}>
            Previous
          </Button>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button variant="contained" onClick={handleNextQuestion} endIcon={<ArrowForwardIcon />}>
              Next
            </Button>
          ) : (
            <Button variant="contained" color="secondary" onClick={calculateScore}>
              Submit Quiz
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

const QuizResultsView = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "quizResults"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const resultsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            resultsData.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
            setResults(resultsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const formatTimestamp = (timestamp) => {
        if (!timestamp?.seconds) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleString('en-IN');
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="quiz results table">
                <TableHead>
                    <TableRow>
                        <TableCell>Enrollment Number</TableCell>
                        <TableCell align="right">Semester</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Tab Switches</TableCell>
                        <TableCell align="right">Timestamp</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((row) => (
                        <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">{row.enrollmentNumber}</TableCell>
                            <TableCell align="right">{row.semester}</TableCell>
                            <TableCell align="right">{`${row.score} / ${row.totalQuestions}`}</TableCell>
                            <TableCell align="right">{row.tabSwitches || 0}</TableCell>
                            <TableCell align="right">{formatTimestamp(row.completedAt)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const AdminDashboard = ({ onLogout, activeTab, setActiveTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <CreateQuiz onQuizCreated={() => setActiveTab(2)} round={1} />;
      case 1:
        return <CreateQuiz onQuizCreated={() => setActiveTab(2)} round={2} />;
      case 2:
        return <QuizList />;
      case 3:
        return <QuizResultsView />;
      default:
        return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">Welcome to the Admin Dashboard!</Typography></Box>;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ borderRadius: 0}}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => setActiveTab(2)}>
            Admin Dashboard
          </Typography>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} textColor="inherit" indicatorColor="secondary" sx={{ flexGrow: 1 }}>
            <Tab label="Create Round 1 Quiz" />
            <Tab label="Create Round 2 Quiz" />
            <Tab label="View All Quizzes" />
            <Tab label="View Results" />
          </Tabs>
          <Button color="inherit" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {renderContent()}
      </Container>
    </Box>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState(VIEWS.AUTH);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userSemester, setUserSemester] = useState(null);
  const [enrollmentNumber, setEnrollmentNumber] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserId(user.uid);
          setUserRole(userData.role);
          setUserSemester(userData.semester);
          setEnrollmentNumber(userData.enrollmentNumber);
          setCurrentView(VIEWS.HOME);
        } else {
          await signOut(auth);
        }
      } else {
        setUserId(null);
        setUserRole(null);
        setUserSemester(null);
        setEnrollmentNumber(null);
        setCurrentView(VIEWS.AUTH);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const renderView = () => {
    const viewName = typeof currentView === 'string' ? currentView : currentView.view;

    if (userRole === 'admin' && viewName !== VIEWS.AUTH) {
      return (
        <AdminDashboard
          onLogout={handleLogout}
          activeTab={activeAdminTab}
          setActiveTab={setActiveAdminTab}
        />
      );
    }

    switch (viewName) {
      case VIEWS.AUTH:
        return <LoginRegister onLogin={() => {}} />;
      case VIEWS.HOME:
        return <UserHome userId={userId} onLogout={handleLogout} onNavigate={setCurrentView} />;
      case VIEWS.USER_QUIZ:
        if (userRole === 'user' && userSemester) {
          return <UserQuiz onQuizCompleted={() => setCurrentView(VIEWS.HOME)} round={currentView.round} userSemester={userSemester} enrollmentNumber={enrollmentNumber}/>;
        }
        return <UserHome userId={userId} onLogout={handleLogout} onNavigate={setCurrentView} />;
      default:
        return <LoginRegister onLogin={() => setCurrentView(VIEWS.HOME)} />;
    }
  };

  if (!isAuthReady) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderView()}
    </ThemeProvider>
  );
}

