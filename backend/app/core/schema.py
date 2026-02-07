from typing import Optional, Literal, List
from pydantic import BaseModel
from datetime import datetime

# --- NODE TYPES ---

class User(BaseModel):
    """Employee / Developer Node."""
    user_id: str
    name: str
    role: Literal['Junior', 'Senior', 'Staff', 'Manager']
    department: str  # "Backend", "Frontend", "Platform"
    salary_band: int  # Hidden for cost calculations
    location: str  # "US", "IN" for timezone analysis

class JiraTicket(BaseModel):
    """Jira Issue Node (Delivery & Planning)."""
    ticket_id: str
    project_id: str
    sprint_id: str
    type: Literal['Bug', 'Story', 'Task', 'TechDebt']
    status: Literal['Done', 'In Progress', 'Blocked', 'Todo']
    priority: Literal['Critical', 'High', 'Medium', 'Low']
    story_points: int
    assignee_id: str
    created_date: datetime
    due_date: datetime
    closed_date: Optional[datetime] = None
    
    # Computed KPIs
    @property
    def cycle_time_days(self) -> Optional[float]:
        if self.closed_date:
            return (self.closed_date - self.created_date).days
        return None
    
    @property
    def is_overdue(self) -> bool:
        if self.closed_date:
            return self.closed_date > self.due_date
        return datetime.now() > self.due_date

class GithubCommit(BaseModel):
    """Git Commit Node (Activity & Burnout)."""
    commit_id: str
    author_id: str
    timestamp: datetime
    lines_added: int
    lines_deleted: int
    files_changed: int
    repo_id: str
    
    @property
    def is_late_night(self) -> bool:
        """Burnout indicator: commits after 8 PM."""
        return self.timestamp.hour >= 20 or self.timestamp.hour < 6
    
    @property
    def churn_ratio(self) -> float:
        """High churn = deleted ~= added."""
        if self.lines_added == 0: return 0
        return self.lines_deleted / self.lines_added

class GithubPR(BaseModel):
    """Pull Request Node (Quality & Bottlenecks)."""
    pr_id: str
    author_id: str
    reviewer_id: str
    status: Literal['Merged', 'Open', 'Closed']
    created_at: datetime
    merged_at: Optional[datetime] = None
    comments_count: int
    ci_status: Literal['Pass', 'Fail']
    
    @property
    def review_time_hours(self) -> Optional[float]:
        if self.merged_at:
            return (self.merged_at - self.created_at).total_seconds() / 3600
        return None

# --- RELATIONSHIP TYPES ---
class Relationship:
    ASSIGNED_TO = "ASSIGNED_TO"      # Ticket -> User
    AUTHORED = "AUTHORED"            # Commit/PR -> User
    REVIEWED = "REVIEWED"            # PR -> User
    BELONGS_TO = "BELONGS_TO"        # Ticket -> Project
    BLOCKS = "BLOCKS"                # Ticket -> Ticket
    PART_OF_SPRINT = "PART_OF_SPRINT" # Ticket -> Sprint
