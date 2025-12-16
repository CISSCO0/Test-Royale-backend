public class PalindromeChecker
{
    public static bool IsPalindrome(string text)
    {
        string clean = text.ToLower();
        string reversed = "";
        for (int i = clean.Length - 1; i >= 0; i--)
        {
            reversed += clean[i];
        }
        return clean == reversed;
    }
}
