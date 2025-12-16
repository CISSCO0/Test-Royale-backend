using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class PalindromeTests
{
    [TestMethod]
    public void Test_Level_IsPalindrome()
    {
        Assert.IsTrue(PalindromeChecker.IsPalindrome("level"));
    }

    [TestMethod]
    public void Test_Hello_IsNotPalindrome()
    {
        Assert.IsFalse(PalindromeChecker.IsPalindrome("hello"));
    }
}