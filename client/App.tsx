import { useEffect, useState } from "react";
import { AccountsManagement } from "./components/AccountsManagement";
import { AddPostForm } from "./components/AddPostForm";
import { CalendarView } from "./components/Calendar";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { RecentPosts } from "./components/RecentPosts";
import { ReportView } from "./components/ReportView";
import { Sidebar } from "./components/Sidebar";
import { getCurrentUser, logout } from "./services/authService";
import { createPost, deletePost, getPosts, updatePost } from "./services/postService";
import { SocialPost, ViewState } from "./types";

export default function App() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      fetchPosts();
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchPosts();
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setPosts([]);
  };

  const handleSavePost = async (post: SocialPost) => {
    try {
      if (editingPost) {
        // Update existing post
        const updated = await updatePost(post.id, post);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
        setEditingPost(null);
      } else {
        // Create new post
        const created = await createPost(post);
        setPosts((prev) => [created, ...prev]);
      }
      setCurrentView("recent-posts");
    } catch (error) {
      console.error("Failed to save post", error);
      alert("Failed to save post");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      try {
        await deletePost(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Failed to delete post", error);
        alert("Failed to delete post");
      }
    }
  };

  const handleEditPost = (post: SocialPost) => {
    setEditingPost(post);
    setCurrentView("add-post");
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setCurrentView("recent-posts");
  };

  if (!isAuthenticated) {
    if (isLoading) return <div>Loading...</div>;
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          if (view === 'accounts-management') {
             // Handle logout if needed or just view
          }
          setCurrentView(view);
          setEditingPost(null);
        }}
      />
      {/* Add a logout button or link somewhere, maybe in Sidebar or Header. For now, temporary logout button */}
      <div className="fixed top-4 right-4 z-50">
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
      </div>

      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {currentView === "dashboard" && <Dashboard posts={posts} />}

          {currentView === "calendar" && (
            <CalendarView
              posts={posts}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          )}

          {currentView === "recent-posts" && (
            <RecentPosts
              posts={posts}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          )}

          {currentView === "report" && <ReportView posts={posts} />}

          {currentView === "accounts-management" && (
            <AccountsManagement posts={posts} />
          )}

          {currentView === "add-post" && (
            <AddPostForm
              initialData={editingPost || undefined}
              onSave={handleSavePost}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
