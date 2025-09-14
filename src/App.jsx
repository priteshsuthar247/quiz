import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, getDocs, updateDoc } from 'firebase/firestore';
import { createTheme, ThemeProvider, CssBaseline, Box, Container, TextField, Button, Typography, Paper, Grid, MenuItem, Alert, CircularProgress, Tabs, Tab, List, ListItem, ListItemText, IconButton, Card, CardContent, Divider, Chip, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, AppBar, Toolbar } from '@mui/material';
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
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
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

const UserHome = ({ onLogout, onNavigate }) => {
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
          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12}>
              <Button 
                fullWidth 
                variant="contained"
                onClick={() => onNavigate({ view: VIEWS.USER_QUIZ, round: 1 })}
              >
                Round 1 Quiz
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={() => onNavigate({ view: VIEWS.USER_QUIZ, round: 2 })}
              >
                Round 2 Quiz
              </Button>
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
  const [questionType, setQuestionType] = useState(round === 1 ? 'mcq' : 'coding');
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState('');
  const [codingQuestion, setCodingQuestion] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('');
  const [codingTestCases, setCodingTestCases] = useState([{ input: '', output: '' }]);
  const [semester, setSemester] = useState('');
  const [quizDuration, setQuizDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewQuiz, setIsNewQuiz] = useState(true);

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
      setIsNewQuiz(false);
      const quizToEdit = existingQuizzes.find(q => q.id === quizId);
      if (quizToEdit) {
        setQuestions(quizToEdit.questions || []);
        setSemester(quizToEdit.semester);
        setQuizDuration(quizToEdit.duration || '');
      }
    } else {
      setIsNewQuiz(true);
      setQuestions([]);
      setSemester('');
      setQuizDuration('');
    }
  };
  
  const handleAddMcqOption = () => {
    if (mcqOptions.length < 5) {
      setMcqOptions([...mcqOptions, '']);
    }
  };

  const handleMcqOptionChange = (index, value) => {
    const newOptions = [...mcqOptions];
    newOptions[index] = value;
    setMcqOptions(newOptions);
  };

  const handleAddTestCase = () => {
    setCodingTestCases([...codingTestCases, { input: '', output: '' }]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...codingTestCases];
    newTestCases[index][field] = value;
    setCodingTestCases(newTestCases);
  };

  const handleAddQuestion = () => {
    if (round === 1) {
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
    } else if (round === 2) {
      if (codingQuestion && codingLanguage && codingTestCases.every(tc => tc.input !== '' && tc.output !== '')) {
        setQuestions([...questions, {
          type: 'coding',
          question: codingQuestion,
          language: codingLanguage,
          testCases: codingTestCases,
        }]);
        setCodingQuestion('');
        setCodingLanguage('');
        setCodingTestCases([{ input: '', output: '' }]);
      } else {
        alert('Please fill out all fields for the question.');
      }
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

        {/* Conditional rendering for Round 1 (MCQ) and Round 2 (Coding) */}
        {round === 1 && (
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
        )}

        {round === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Add Coding Question</Typography>
            <TextField
              fullWidth
              select
              label="Select Language"
              value={codingLanguage}
              onChange={(e) => setCodingLanguage(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="C++">C++</MenuItem>
              <MenuItem value="Java">Java</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Problem Statement (Code with missing lines)"
              value={codingQuestion}
              onChange={(e) => setCodingQuestion(e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Test Cases</Typography>
            <Grid container spacing={2}>
              {codingTestCases.map((testCase, index) => (
                <Grid item xs={12} key={index} sx={{ border: '1px solid #ccc', borderRadius: '8px', p: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Input ${index + 1}`}
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label={`Expected Output ${index + 1}`}
                    value={testCase.output}
                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              ))}
            </Grid>
            <Button variant="outlined" fullWidth onClick={handleAddTestCase}>Add Another Test Case</Button>
          </Box>
        )}
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
                secondary={
                  q.type === 'mcq' ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      Correct Answer: {q.correctAnswer}
                    </Typography>
                  ) : `Language: ${q.language || 'N/A'}`
                }
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

const QuizList = ({ onNavigate }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'quizzes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quizList = [];
      querySnapshot.forEach((doc) => {
        quizList.push({ id: doc.id, ...doc.data() });
      });
      setQuizzes(quizList.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
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

const oneCompilerConfig = {
  apiBaseUrl: 'https://onecompiler-api.p.rapidapi.com/api/v1/run',
  apiKey: '', // Replace with your actual RapidAPI key
  apiHost: 'onecompiler-api.p.rapidapi.com',
};

// Map programming language names to OneCompiler language strings
const languageMap = {
  'C': 'c',
  'C++': 'cpp',
  'Java': 'java',
};

const UserQuiz = ({ onQuizCompleted, round, userSemester }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [userCode, setUserCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState('');
  const [showCodeResult, setShowCodeResult] = useState(false);

  // Function to shuffle an array
  const shuffleArray = (array) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError('');
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
          
          // Randomly select questions based on round
          const numQuestions = round === 1 ? 10 : 3;
          const shuffledQuestions = shuffleArray(quizData.questions);
          const selectedQuestions = shuffledQuestions.slice(0, numQuestions);
          
          const newQuizData = {
            ...quizData,
            questions: selectedQuestions
          };
          
          setQuiz(newQuizData);
          setTimeLeft(newQuizData.duration * 60); // Set time in seconds
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

    fetchQuiz();
  }, [round, userSemester]);

  useEffect(() => {
    if (quiz && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            calculateScore();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, quizFinished]);

  const handleAnswerChange = (event) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: event.target.value };
    setAnswers(newAnswers);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowCodeResult(false);
      setCodeOutput('');
      setCompilationStatus('');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowCodeResult(false);
      setCodeOutput('');
      setCompilationStatus('');
    }
  };

  const handleRunCode = async () => {
    setIsCompiling(true);
    setCodeOutput('');
    setCompilationStatus('');
    setShowCodeResult(true);

    const question = quiz.questions[currentQuestionIndex];
    if (!question || question.type !== 'coding' || !question.language) {
      setCompilationStatus('Error: Invalid question type or language.');
      setIsCompiling(false);
      return;
    }

    const language = languageMap[question.language];
    const testCase = question.testCases[0];
    const sourceCode = userCode;

    if (!language || !sourceCode) {
      setCompilationStatus('Error: Missing language or code.');
      setIsCompiling(false);
      return;
    }

    const payload = {
      language: language,
      stdin: testCase.input,
      code: sourceCode,
    };

    try {
      const response = await fetch(oneCompilerConfig.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': oneCompilerConfig.apiHost,
          'X-RapidAPI-Key': oneCompilerConfig.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      setCodeOutput(data.output || data.error);

      if (data.output === testCase.output) {
        setCompilationStatus('Accepted');
        const newAnswers = { ...answers, [currentQuestionIndex]: { passed: true } };
        setAnswers(newAnswers);
      } else {
        setCompilationStatus('Wrong Answer');
        const newAnswers = { ...answers, [currentQuestionIndex]: { passed: false } };
        setAnswers(newAnswers);
      }

    } catch (e) {
      console.error("Error during code execution:", e);
      setCompilationStatus('Error: Could not connect to the compiler.');
    } finally {
      setIsCompiling(false);
    }
  };


  const calculateScore = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    let newScore = 0;
    quiz.questions.forEach((q, index) => {
      if (q.type === 'mcq') {
        if (answers[index] === q.correctAnswer) {
          newScore += 1;
        }
      } else if (q.type === 'coding') {
        if (answers[index]?.passed) {
          newScore += 1;
        }
      }
    });
    setScore(newScore);
    setQuizFinished(true);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
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
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Review Your Answers</Typography>
          <List>
            {quiz.questions.map((q, index) => {
              const userAnswer = answers[index] || 'No answer provided';
              const isCorrect = q.type === 'mcq' && userAnswer === q.correctAnswer;
              return (
                <ListItem key={index} alignItems="flex-start" sx={{ borderBottom: '1px solid #eee', mb: 2 }}>
                  <ListItemText
                    primary={`Question ${index + 1}: ${q.question}`}
                    secondary={
                      <Box component="span">
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Your Answer: {q.type === 'mcq' ? userAnswer : (answers[index]?.passed ? 'Correct' : 'Incorrect')}
                          <IconButton size="small" sx={{ ml: 1 }}>
                            {q.type === 'mcq' ? (isCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />) : (answers[index]?.passed ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />)}
                          </IconButton>
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                          Correct Answer: {q.type === 'mcq' ? q.correctAnswer : q.testCases[0].output}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
          {quiz.questions.map((_, index) => (
            <Chip
              key={index}
              label={index + 1}
              color={answers[index] ? 'primary' : 'default'}
              variant={currentQuestionIndex === index ? 'filled' : 'outlined'}
              onClick={() => setCurrentQuestionIndex(index)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ minHeight: '300px' }}>
          {currentQuestion.type === 'mcq' && (
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                <Typography variant="body1">{currentQuestion.question}</Typography>
              </FormLabel>
              <RadioGroup
                value={answers[currentQuestionIndex] || ''}
                onChange={handleAnswerChange}
              >
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          {currentQuestion.type === 'coding' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {currentQuestion.question}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                label={`Your Code (${currentQuestion.language})`}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleRunCode}
                disabled={isCompiling}
                sx={{ mt: 2 }}
              >
                {isCompiling ? <CircularProgress size={24} color="inherit" /> : 'Run Code'}
              </Button>
              {showCodeResult && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Expected Output</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={currentQuestion.testCases[0].output}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Your Output</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={isCompiling ? 'Compiling...' : codeOutput}
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity={compilationStatus === 'Accepted' ? 'success' : 'error'}>
                      {compilationStatus}
                    </Alert>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            startIcon={<ArrowBackIcon />}
          >
            Previous
          </Button>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNextQuestion}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={calculateScore}
            >
              Submit Quiz
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

// New AdminDashboard component with tabs
const AdminDashboard = ({ onLogout, onNavigate, activeTab, setActiveTab }) => {
  const [loading, setLoading] = useState(false);

  // Render the appropriate component based on the activeTab state
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <CreateQuiz onQuizCreated={() => setActiveTab(2)} round={1} />;
      case 1:
        return <CreateQuiz onQuizCreated={() => setActiveTab(2)} round={2} />;
      case 2:
        return <QuizList onNavigate={onNavigate} />;
      default:
        return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">Welcome to the Admin Dashboard!</Typography></Box>;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => setActiveTab(2)}>
            Admin Dashboard
          </Typography>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} textColor="inherit" indicatorColor="secondary" sx={{ flexGrow: 1 }}>
            <Tab label="Create Round 1 Quiz" />
            <Tab label="Create Round 2 Quiz" />
            <Tab label="View All Quizzes" />
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
  const [userRole, setUserRole] = useState(null);
  const [userSemester, setUserSemester] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (error) {
        console.error("Custom token sign-in failed:", error);
      } finally {
        setIsAuthReady(true);
      }
    };
    initializeAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData.role);
          setUserSemester(userData.semester);
          setCurrentView(VIEWS.HOME);
        } else {
          await signOut(auth);
          setCurrentView(VIEWS.AUTH);
        }
      } else {
        setUserRole(null);
        setUserSemester(null);
        setCurrentView(VIEWS.AUTH);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView(VIEWS.AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  const renderView = () => {
    // Determine the view name from the currentView state, handling both strings and objects
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
        return <LoginRegister onLogin={() => setCurrentView(VIEWS.HOME)} />;
      case VIEWS.HOME:
        return <UserHome onLogout={handleLogout} onNavigate={setCurrentView} />;
      case VIEWS.USER_QUIZ:
        if (userRole === 'user' && userSemester) {
          return <UserQuiz onQuizCompleted={() => setCurrentView(VIEWS.HOME)} round={currentView.round} userSemester={userSemester} />;
        }
        return <UserHome onLogout={handleLogout} onNavigate={setCurrentView} />;
      default:
        return null;
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
